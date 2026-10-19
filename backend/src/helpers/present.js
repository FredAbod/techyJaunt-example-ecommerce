function toPublicWallet(wallet) {
  if (!wallet) return null;
  return {
    id: wallet._id,
    accountNumber: wallet.accountNumber,
    balanceKobo: Number.isInteger(wallet.balanceKobo) ? wallet.balanceKobo : 0,
    currency: wallet.currency || "NGN",
    status: wallet.status || "active",
  };
}

function toPublicTransaction(entry) {
  return {
    id: entry._id,
    type: entry.type,
    purpose: entry.purpose,
    amountKobo: entry.amountKobo,
    balanceBeforeKobo: entry.balanceBeforeKobo,
    balanceAfterKobo: entry.balanceAfterKobo,
    description: entry.description,
    status: entry.status,
    reference: entry.reference,
    createdAt: entry.createdAt,
  };
}

function toPublicOrder(order) {
  if (!order) return null;
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalKobo: order.totalKobo,
    items: (order.items || []).map((item) => ({
      productId: item.product,
      name: item.name,
      unitPriceKobo: item.unitPriceKobo,
      quantity: item.quantity,
    })),
    createdAt: order.createdAt,
    paidAt: order.paidAt || null,
  };
}

function toPublicPayment(payment) {
  if (!payment) return null;
  return {
    reference: payment.reference,
    purpose: payment.purpose,
    status: payment.status,
    amountKobo: payment.amountKobo,
    currency: payment.currency,
    channel: payment.channel || null,
    paidAt: payment.paidAt || null,
  };
}

function paymentMessage(payment, order, pending) {
  if (pending || payment?.status === "initialized") {
    return "Paystack has not confirmed this payment yet.";
  }
  if (payment?.purpose === "wallet_topup" && payment.status === "success") {
    return "The money is in your wallet.";
  }
  if (order?.status === "paid") {
    return "Payment received. Those items are now set aside for you.";
  }
  if (order?.status === "paid_unfulfilled") {
    return "We received the money, but an item sold out before we could reserve it.";
  }
  if (payment?.status === "abandoned") {
    return "The payment was cancelled before it finished.";
  }
  if (payment?.status === "failed") {
    return "The payment did not go through.";
  }
  return "We are still checking this payment.";
}

module.exports = {
  toPublicWallet,
  toPublicTransaction,
  toPublicOrder,
  toPublicPayment,
  paymentMessage,
};
