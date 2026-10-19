const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { signaturesMatch } = require("./services/paystack.client");
const { paymentReference, orderNumber, accountNumber } = require("./helpers/reference");
const { MIN_TOPUP_KOBO, MIN_PAYSTACK_KOBO, MAX_CHARGE_KOBO } = require("./helpers/money");

test("Paystack stamp matches only the exact body and secret", () => {
  const secret = "sk_test_example";
  const body = Buffer.from('{"event":"charge.success","data":{"reference":"tj_topup_abc"}}');
  const signature = crypto.createHmac("sha512", secret).update(body).digest("hex");

  assert.equal(signaturesMatch(body, signature, secret), true);
  assert.equal(signaturesMatch(Buffer.from(body.toString() + " "), signature, secret), false);
  assert.equal(signaturesMatch(body, signature, "sk_test_other"), false);
  assert.equal(signaturesMatch(body, "abc", secret), false);
  assert.equal(signaturesMatch(body, "", secret), false);
  assert.equal(signaturesMatch(null, signature, secret), false);
});

test("references stay inside the characters Paystack allows", () => {
  const topup = paymentReference("wallet_topup");
  const order = paymentReference("order");
  const allowed = /^[A-Za-z0-9._=-]+$/;

  assert.match(topup, /^tj_topup_[a-f0-9]{24}$/);
  assert.match(order, /^tj_order_[a-f0-9]{24}$/);
  assert.match(topup, allowed);
  assert.match(order, allowed);
  assert.notEqual(topup, paymentReference("wallet_topup"));
  assert.match(orderNumber(), /^TJ[A-F0-9]{10}$/);
  assert.match(accountNumber(), /^[1-9][0-9]{9}$/);
});

test("money limits stay whole kobo amounts", () => {
  assert.equal(Number.isInteger(MIN_TOPUP_KOBO), true);
  assert.equal(Number.isInteger(MIN_PAYSTACK_KOBO), true);
  assert.equal(Number.isInteger(MAX_CHARGE_KOBO), true);
  assert.ok(MIN_TOPUP_KOBO >= MIN_PAYSTACK_KOBO);
  assert.ok(MAX_CHARGE_KOBO > MIN_TOPUP_KOBO);
});
