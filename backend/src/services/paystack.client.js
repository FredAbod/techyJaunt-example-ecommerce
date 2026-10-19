const crypto = require("crypto");
const AppError = require("../helpers/appError");

const PAYSTACK_BASE = "https://api.paystack.co";

function signaturesMatch(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(String(signature));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function paystackRequest(path, { method = "GET", body } = {}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new AppError("Payments are not configured yet.", 503, "payments_unconfigured");
  }

  let response;
  try {
    response = await fetch(`${PAYSTACK_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("Paystack request failed", error.message);
    throw new AppError(
      "The payment service could not be reached. Try again.",
      502,
      "provider_unavailable",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status === false) {
    console.error("Paystack rejected a request", response.status, payload.message || "");
    throw new AppError(
      "The payment service could not complete that request.",
      502,
      "provider_unavailable",
    );
  }

  return payload;
}

function initializeTransaction(body) {
  return paystackRequest("/transaction/initialize", { method: "POST", body });
}

function verifyTransaction(reference) {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
}

module.exports = {
  signaturesMatch,
  initializeTransaction,
  verifyTransaction,
};
