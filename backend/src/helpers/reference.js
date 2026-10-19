const crypto = require("crypto");

function paymentReference(purpose) {
  const tag = purpose === "wallet_topup" ? "topup" : "order";
  return `tj_${tag}_${crypto.randomBytes(12).toString("hex")}`;
}

function orderNumber() {
  return `TJ${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function accountNumber() {
  return String(crypto.randomInt(1_000_000_000, 10_000_000_000));
}

module.exports = { paymentReference, orderNumber, accountNumber };
