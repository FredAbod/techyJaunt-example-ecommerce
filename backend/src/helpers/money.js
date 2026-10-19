// Product prices are already stored as kobo. Wallet money uses the same unit
// so a naira amount is never a JavaScript decimal (10.50 can become 10.499999).
const MIN_TOPUP_KOBO = 10_000;
const MIN_PAYSTACK_KOBO = 5_000;
const MAX_CHARGE_KOBO = 500_000_000;

module.exports = {
  MIN_TOPUP_KOBO,
  MIN_PAYSTACK_KOBO,
  MAX_CHARGE_KOBO,
};
