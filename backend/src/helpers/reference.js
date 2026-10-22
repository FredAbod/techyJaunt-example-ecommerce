const crypto = require("crypto");

function paymentReference(purpose) {
  const tag = purpose === "wallet_topup" ? "topup" : "order";
  return `tj_${tag}_${crypto.randomBytes(12).toString("hex")}`;
}

function orderNumber() {
  return `TJ${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

module.exports = { paymentReference, orderNumber };
