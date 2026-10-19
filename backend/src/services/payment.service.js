const Cart = require("../models/cart.models");
const Product = require("../models/product.models");
const Order = require("../models/order.models");
const Payment = require("../models/payment.models");
const Wallet = require("../models/wallets.models");
const { ensureWallet, applyBalanceChange } = require("./wallet.service");
const paystack = require("./paystack.client");
const withDbTransaction = require("../helpers/withTransaction");
const AppError = require("../helpers/appError");
const { isDuplicateKey } = require("../helpers/mongoError");
const { paymentReference, orderNumber } = require("../helpers/reference");
const { MIN_PAYSTACK_KOBO, MAX_CHARGE_KOBO, MIN_TOPUP_KOBO } = require("../helpers/money");

const CHANNELS = ["card", "bank", "ussd", "bank_transfer", "qr"];
const TERMINAL_FAILURE = new Set(["failed", "abandoned", "reversed"]);

function frontendBase() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

function clip(value, max = 300) {
  if (!value) return null;
  return String(value).slice(0, max);
}

async function quoteCart(userId, session) {
  const cartQuery = Cart.findOne({ user: userId });
  const cart = session ? await cartQuery.session(session) : await cartQuery;
  if (!cart || cart.items.length === 0) {
    throw new AppError("Your cart is empty.", 400, "empty_cart");
  }

  const productQuery = Product.find({ _id: { $in: cart.items.map((item) => item.product) } });
  const products = session ? await productQuery.session(session) : await productQuery;
  const byId = new Map(products.map((product) => [String(product._id), product]));

  const items = [];
  for (const line of cart.items) {
    const product = byId.get(String(line.product));
    if (!product) {
      throw new AppError("A product in your cart is no longer for sale.", 400, "product_missing");
    }
    if (line.quantity > product.stock) {
      throw new AppError(`${product.name} does not have enough left in stock.`, 400, "out_of_stock");
    }
    if (!Number.isInteger(product.price) || product.price < 0) {
      throw new AppError("A product has a broken price.", 500);
    }
    items.push({
      product: product._id,
      name: product.name,
      unitPriceKobo: product.price,
      quantity: line.quantity,
    });
  }

  const totalKobo = items.reduce((sum, item) => sum + item.unitPriceKobo * item.quantity, 0);
  if (!Number.isSafeInteger(totalKobo) || totalKobo <= 0) {
    throw new AppError("This cart total is not valid.", 400, "invalid_amount");
  }
  if (totalKobo > MAX_CHARGE_KOBO) {
    throw new AppError("This order is too large for one payment.", 400, "amount_too_large");
  }

  return { items, totalKobo };
}

async function decrementStock(session, items) {
  const taken = [];
  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true, session },
    );
    if (!product) return { ok: false, taken };
    taken.push(item);
  }
  return { ok: true, taken };
}

async function restoreStock(session, items) {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } },
      { session },
    );
  }
}

async function removeOrderedItems(session, userId, items) {
  const cart = await Cart.findOne({ user: userId }).session(session);
  if (!cart) return;

  const next = [];
  for (const line of cart.items) {
    const ordered = items.find((item) => String(item.product) === String(line.product));
    if (!ordered) {
      next.push(line);
      continue;
    }
    const left = line.quantity - ordered.quantity;
    if (left > 0) next.push({ product: line.product, quantity: left });
  }

  cart.items = next;
  await cart.save({ session });
}

async function findReplay(userId, idempotencyKey) {
  if (!idempotencyKey) return null;
  const order = await Order.findOne({ userId, idempotencyKey });
  if (!order) return null;

  if (order.status === "paid" || order.status === "paid_unfulfilled") {
    return { kind: "done", order };
  }

  if (order.status === "pending_payment" && order.paymentMethod === "paystack") {
    const payment = await Payment.findOne({ reference: order.paymentReference }).select(
      "+authorizationUrl",
    );
    if (payment?.status === "initialized" && payment.authorizationUrl) {
      return { kind: "resume", order, payment };
    }
    const age = Date.now() - new Date(order.createdAt).getTime();
    if (!payment || payment.status === "initialized") {
      if (age < 60_000) return { kind: "starting", order };
      if (payment) {
        await recordProviderFailure(payment.reference, "Checkout link was not saved");
      } else {
        await Order.updateOne(
          { _id: order._id, status: "pending_payment" },
          { $set: { status: "failed" }, $unset: { idempotencyKey: "" } },
        );
      }
      return null;
    }
  }

  return null;
}

function resumeBody(replay) {
  return {
    order: replay.order,
    payment: replay.payment,
    wallet: null,
    replayed: true,
    authorizationUrl: replay.payment.authorizationUrl,
    reference: replay.payment.reference,
    amountKobo: replay.payment.amountKobo,
  };
}

async function payWithWalletOnce(session, user, idempotencyKey) {
  const existing = await Order.findOne({ userId: user._id, idempotencyKey }).session(session);
  if (existing && (existing.status === "paid" || existing.status === "paid_unfulfilled")) {
    const wallet = await Wallet.findOne({ userId: user._id }).session(session);
    return {
      order: existing,
      wallet,
      replayed: true,
      authorizationUrl: null,
      reference: null,
      amountKobo: existing.totalKobo,
    };
  }

  const quote = await quoteCart(user._id, session);
  const order = new Order({
    userId: user._id,
    orderNumber: orderNumber(),
    items: quote.items,
    totalKobo: quote.totalKobo,
    currency: "NGN",
    status: "paid",
    paymentMethod: "wallet",
    idempotencyKey,
    paidAt: new Date(),
  });

  const reference = `tj_wallet_${order._id}`;
  const { wallet } = await applyBalanceChange(session, {
    userId: user._id,
    amountKobo: quote.totalKobo,
    direction: "debit",
    reference,
    provider: "wallet",
    purpose: "purchase",
    description: `Paid for order ${order.orderNumber}`,
    orderId: order._id,
  });

  const stock = await decrementStock(session, quote.items);
  if (!stock.ok) {
    throw new AppError("Something in your cart just sold out.", 409, "out_of_stock");
  }

  await removeOrderedItems(session, user._id, quote.items);
  order.paymentReference = reference;
  await order.save({ session });

  return {
    order,
    wallet,
    replayed: false,
    authorizationUrl: null,
    reference: null,
    amountKobo: quote.totalKobo,
  };
}

async function payWithWallet(user, idempotencyKey) {
  const wallet = await ensureWallet(user._id);
  if (wallet.status !== "active") {
    throw new AppError("This wallet is frozen.", 403, "wallet_frozen");
  }

  const replay = await findReplay(user._id, idempotencyKey);
  if (replay?.kind === "done") {
    const current = await Wallet.findOne({ userId: user._id });
    return {
      order: replay.order,
      wallet: current,
      replayed: true,
      authorizationUrl: null,
      reference: null,
      amountKobo: replay.order.totalKobo,
    };
  }

  try {
    return await withDbTransaction((session) => payWithWalletOnce(session, user, idempotencyKey));
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const again = await findReplay(user._id, idempotencyKey);
    if (again?.kind === "done") {
      const current = await Wallet.findOne({ userId: user._id });
      return {
        order: again.order,
        wallet: current,
        replayed: true,
        authorizationUrl: null,
        reference: null,
        amountKobo: again.order.totalKobo,
      };
    }
    throw new AppError("Payment is still starting. Try again in a moment.", 409, "payment_starting");
  }
}

async function openPaystackCharge({ user, wallet, purpose, amountKobo, order }) {
  const reference = order ? order.paymentReference : paymentReference(purpose);
  const payment = await Payment.create({
    userId: user._id,
    walletId: wallet?._id || null,
    orderId: order?._id || null,
    reference,
    purpose,
    amountKobo,
    currency: "NGN",
    email: user.email,
    status: "initialized",
  });

  let started;
  try {
    started = await paystack.initializeTransaction({
      email: user.email,
      amount: String(amountKobo),
      currency: "NGN",
      reference,
      callback_url: `${frontendBase()}/payments/callback`,
      channels: CHANNELS,
      metadata: {
        purpose,
        user_id: String(user._id),
        cancel_action: `${frontendBase()}/cart`,
      },
    });
  } catch (error) {
    payment.status = "failed";
    payment.gatewayResponse = clip(error.message);
    await payment.save();
    if (order) {
      await Order.updateOne(
        { _id: order._id, status: "pending_payment" },
        { $set: { status: "failed" }, $unset: { idempotencyKey: "" } },
      );
    }
    throw error;
  }

  payment.accessCode = started.data?.access_code || null;
  payment.authorizationUrl = started.data?.authorization_url || null;
  if (!payment.authorizationUrl) {
    payment.status = "failed";
    payment.gatewayResponse = "Missing checkout link";
    await payment.save();
    if (order) {
      await Order.updateOne(
        { _id: order._id, status: "pending_payment" },
        { $set: { status: "failed" }, $unset: { idempotencyKey: "" } },
      );
    }
    throw new AppError("The payment service did not return a checkout link.", 502, "provider_unavailable");
  }

  await payment.save();
  return payment;
}

async function startTopUp(user, amountKobo) {
  if (!Number.isInteger(amountKobo) || amountKobo < MIN_TOPUP_KOBO || amountKobo > MAX_CHARGE_KOBO) {
    throw new AppError("Top up must be between ₦100 and ₦5,000,000.", 400, "invalid_amount");
  }

  const wallet = await ensureWallet(user._id);
  if (wallet.status !== "active") {
    throw new AppError("This wallet is frozen.", 403, "wallet_frozen");
  }

  const payment = await openPaystackCharge({
    user,
    wallet,
    purpose: "wallet_topup",
    amountKobo,
  });

  return {
    order: null,
    wallet,
    payment,
    replayed: false,
    authorizationUrl: payment.authorizationUrl,
    reference: payment.reference,
    amountKobo,
  };
}

async function startPaystackCheckout(user, idempotencyKey) {
  const replay = await findReplay(user._id, idempotencyKey);
  if (replay?.kind === "done") {
    return {
      order: replay.order,
      wallet: await Wallet.findOne({ userId: user._id }),
      replayed: true,
      authorizationUrl: null,
      reference: replay.order.paymentReference,
      amountKobo: replay.order.totalKobo,
    };
  }
  if (replay?.kind === "resume") return resumeBody(replay);
  if (replay?.kind === "starting") {
    throw new AppError("Payment is still starting. Try again in a moment.", 409, "payment_starting");
  }

  const quote = await quoteCart(user._id);
  if (quote.totalKobo < MIN_PAYSTACK_KOBO) {
    throw new AppError("Paystack needs at least ₦50 for a payment.", 400, "amount_too_small");
  }

  const wallet = await ensureWallet(user._id);
  const reference = paymentReference("order");

  let order;
  try {
    order = await Order.create({
      userId: user._id,
      orderNumber: orderNumber(),
      items: quote.items,
      totalKobo: quote.totalKobo,
      currency: "NGN",
      status: "pending_payment",
      paymentMethod: "paystack",
      paymentReference: reference,
      idempotencyKey,
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const again = await findReplay(user._id, idempotencyKey);
    if (again?.kind === "resume") return resumeBody(again);
    if (again?.kind === "done") {
      return {
        order: again.order,
        wallet,
        replayed: true,
        authorizationUrl: null,
        reference: again.order.paymentReference,
        amountKobo: again.order.totalKobo,
      };
    }
    throw new AppError("Payment is still starting. Try again in a moment.", 409, "payment_starting");
  }

  const payment = await openPaystackCharge({
    user,
    wallet,
    purpose: "order",
    amountKobo: quote.totalKobo,
    order,
  });

  return {
    order,
    wallet,
    payment,
    replayed: false,
    authorizationUrl: payment.authorizationUrl,
    reference: payment.reference,
    amountKobo: quote.totalKobo,
  };
}

async function startCheckout(user, { method, idempotencyKey }) {
  if (method === "wallet") return payWithWallet(user, idempotencyKey);
  return startPaystackCheckout(user, idempotencyKey);
}

async function recordProviderFailure(reference, gatewayResponse, status = "failed") {
  const next = status === "abandoned" ? "abandoned" : "failed";
  const payment = await Payment.findOneAndUpdate(
    { reference, status: "initialized" },
    { $set: { status: next, gatewayResponse: clip(gatewayResponse) } },
    { new: true },
  );
  if (!payment?.orderId) return payment;

  await Order.updateOne(
    { _id: payment.orderId, status: "pending_payment" },
    { $set: { status: "failed" }, $unset: { idempotencyKey: "" } },
  );
  return payment;
}

function stampPayment(payment, charge) {
  payment.status = "success";
  payment.paidAt = charge.paid_at ? new Date(charge.paid_at) : new Date();
  payment.channel = charge.channel || null;
  payment.feesKobo = Number.isInteger(charge.fees) && charge.fees >= 0 ? charge.fees : 0;
  payment.gatewayResponse = clip(charge.gateway_response || "Successful");
}

async function applySuccessfulCharge(session, paymentId, charge) {
  const payment = await Payment.findById(paymentId).session(session);
  if (!payment) throw new AppError("Payment not found.", 404, "payment_missing");

  if (payment.status === "success") {
    const order = payment.orderId ? await Order.findById(payment.orderId).session(session) : null;
    const wallet = await Wallet.findOne({ userId: payment.userId }).session(session);
    return { payment, order, wallet, alreadySettled: true };
  }

  if (payment.status !== "initialized") {
    throw new AppError("This payment is already closed.", 409, "payment_closed");
  }

  if (Number(charge.amount) !== payment.amountKobo || charge.currency !== "NGN") {
    throw new AppError("Payment amount did not match what we charged.", 409, "amount_mismatch");
  }

  if (payment.purpose === "wallet_topup") {
    const { wallet } = await applyBalanceChange(session, {
      userId: payment.userId,
      amountKobo: payment.amountKobo,
      direction: "credit",
      reference: payment.reference,
      provider: "paystack",
      purpose: "topup",
      description: "Money added with Paystack",
      paymentId: payment._id,
    });
    stampPayment(payment, charge);
    await payment.save({ session });
    return { payment, order: null, wallet, alreadySettled: false };
  }

  const order = await Order.findById(payment.orderId).session(session);
  if (!order) throw new AppError("Order not found.", 404, "order_missing");
  if (order.status === "paid" || order.status === "paid_unfulfilled") {
    stampPayment(payment, charge);
    await payment.save({ session });
    const wallet = await Wallet.findOne({ userId: payment.userId }).session(session);
    return { payment, order, wallet, alreadySettled: true };
  }
  if (order.status !== "pending_payment") {
    throw new AppError("This order is already closed.", 409, "payment_closed");
  }

  const stock = await decrementStock(session, order.items);
  if (!stock.ok) {
    await restoreStock(session, stock.taken);
    order.status = "paid_unfulfilled";
  } else {
    await removeOrderedItems(session, order.userId, order.items);
    order.status = "paid";
  }

  order.paidAt = charge.paid_at ? new Date(charge.paid_at) : new Date();
  await order.save({ session });
  stampPayment(payment, charge);
  await payment.save({ session });
  const wallet = await Wallet.findOne({ userId: payment.userId }).session(session);
  return { payment, order, wallet, alreadySettled: false };
}

async function loadOutcome(payment, extras = {}) {
  const order = extras.order !== undefined
    ? extras.order
    : payment.orderId
      ? await Order.findById(payment.orderId)
      : null;
  const wallet = extras.wallet !== undefined
    ? extras.wallet
    : await Wallet.findOne({ userId: payment.userId });

  return {
    payment,
    order,
    wallet,
    alreadySettled: Boolean(extras.alreadySettled),
    pending: Boolean(extras.pending),
  };
}

async function confirmPayment({ reference, userId }) {
  const payment = await Payment.findOne({ reference });
  if (!payment || (userId && String(payment.userId) !== String(userId))) {
    throw new AppError("Payment not found.", 404, "payment_missing");
  }

  if (payment.status === "success") {
    return loadOutcome(payment, { alreadySettled: true });
  }
  if (payment.status === "failed" || payment.status === "abandoned") {
    return loadOutcome(payment);
  }

  const verified = await paystack.verifyTransaction(reference);
  const charge = verified.data;
  if (!charge || charge.reference !== reference) {
    throw new AppError("Payment could not be confirmed.", 502, "provider_unavailable");
  }

  if (charge.status !== "success") {
    if (TERMINAL_FAILURE.has(charge.status)) {
      const next = charge.status === "abandoned" ? "abandoned" : "failed";
      await recordProviderFailure(reference, charge.gateway_response, next);
      payment.status = next;
    }
    return loadOutcome(payment, { pending: payment.status === "initialized" });
  }

  if (Number(charge.amount) !== payment.amountKobo || charge.currency !== "NGN") {
    await Payment.updateOne(
      { _id: payment._id, status: "initialized" },
      {
        $set: {
          status: "failed",
          failureReason: "amount_mismatch",
          gatewayResponse: clip(charge.gateway_response),
        },
      },
    );
    if (payment.orderId) {
      await Order.updateOne(
        { _id: payment.orderId, status: "pending_payment" },
        { $set: { status: "failed" }, $unset: { idempotencyKey: "" } },
      );
    }
    throw new AppError("Payment amount did not match what we charged.", 409, "amount_mismatch");
  }

  try {
    const settled = await withDbTransaction((session) =>
      applySuccessfulCharge(session, payment._id, charge),
    );
    return loadOutcome(settled.payment, settled);
  } catch (error) {
    if (error.code === "amount_mismatch") throw error;
    if (!isDuplicateKey(error)) throw error;
    const current = await Payment.findById(payment._id);
    if (current?.status === "success") {
      return loadOutcome(current, { alreadySettled: true });
    }
    throw error;
  }
}

async function acceptWebhook(rawBody, signature, body) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new AppError("Payments are not configured yet.", 503, "payments_unconfigured");
  }
  if (!paystack.signaturesMatch(rawBody, signature, secret)) {
    throw new AppError("Invalid signature", 401, "bad_signature");
  }

  const reference = body?.data?.reference;
  if (!reference || typeof reference !== "string") return;

  if (body.event === "charge.success") {
    await confirmPayment({ reference });
    return;
  }
  if (body.event === "charge.failed") {
    await recordProviderFailure(reference, body.data?.gateway_response, "failed");
  }
}

module.exports = {
  startTopUp,
  startCheckout,
  confirmPayment,
  acceptWebhook,
};
