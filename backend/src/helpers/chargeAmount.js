// Paystack's `amount` is what the customer was charged.
// `requested_amount` is what we asked for. When the customer pays the
// Paystack fee, amount is requested_amount plus fees. The wallet is credited
// the requested amount only.
function chargeMatchesPayment(charge, payment) {
  if (!charge || charge.currency !== payment.currency) return false;

  const amount = Number(charge.amount);
  const requested = charge.requested_amount == null || charge.requested_amount === ""
    ? amount
    : Number(charge.requested_amount);
  const fees = Number(charge.fees);

  if (!Number.isInteger(amount) || amount < 1) return false;
  if (!Number.isInteger(requested) || requested !== payment.amountKobo) return false;
  if (amount === requested) return true;
  if (!Number.isInteger(fees) || fees < 0) return false;
  return amount === requested + fees;
}

module.exports = { chargeMatchesPayment };
