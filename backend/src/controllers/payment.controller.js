const asyncHandler = require("../helpers/asyncHandler");
const { loadCart, formatCart } = require("./cart.controllers");
const {
  startTopUp,
  startCheckout,
  confirmPayment,
  acceptWebhook,
} = require("../services/payment.service");
const {
  toPublicWallet,
  toPublicOrder,
  toPublicPayment,
  paymentMessage,
} = require("../helpers/present");

function checkoutBody(result, cart) {
  return {
    replayed: Boolean(result.replayed),
    authorizationUrl: result.authorizationUrl || null,
    reference: result.reference || null,
    amountKobo: result.amountKobo,
    order: toPublicOrder(result.order),
    wallet: toPublicWallet(result.wallet),
    cart: formatCart(cart),
  };
}

const topUp = asyncHandler(async (req, res) => {
  const result = await startTopUp(req.user, req.body.amountKobo);
  return res.status(201).json({
    authorizationUrl: result.authorizationUrl,
    reference: result.reference,
    amountKobo: result.amountKobo,
  });
});

const checkout = asyncHandler(async (req, res) => {
  const result = await startCheckout(req.user, req.body);
  const cart = await loadCart(req.user._id);
  return res.status(200).json(checkoutBody(result, cart));
});

const verify = asyncHandler(async (req, res) => {
  const outcome = await confirmPayment({
    reference: req.body.reference,
    userId: req.user._id,
  });

  return res.status(200).json({
    payment: toPublicPayment(outcome.payment),
    order: toPublicOrder(outcome.order),
    wallet: toPublicWallet(outcome.wallet),
    pending: outcome.pending,
    message: paymentMessage(outcome.payment, outcome.order, outcome.pending),
  });
});

// Paystack calls this. A bad signature is rejected. A repeat success is safe.
const webhook = async (req, res) => {
  try {
    await acceptWebhook(req.rawBody, req.get("x-paystack-signature"), req.body);
    return res.sendStatus(200);
  } catch (error) {
    if (error.status === 401 || error.status === 503) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.status === 404 || error.status === 409) {
      return res.sendStatus(200);
    }
    console.error("Paystack webhook failed", error.message);
    return res.sendStatus(500);
  }
};

module.exports = { topUp, checkout, verify, webhook };
