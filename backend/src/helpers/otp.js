const crypto = require("crypto");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const hashOtp = (otp) =>
  crypto
    .createHash("sha256")
    .update(`${String(otp)}:${process.env.JWT_SECRET}`)
    .digest("hex");

const assignOtp = (user, purpose) => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.otpHash = hashOtp(otp);
  user.otpPurpose = purpose;
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpSentAt = new Date();
  user.otpAttempts = 0;
  return otp;
};

const clearOtp = (user) => {
  user.otpHash = null;
  user.otpPurpose = null;
  user.otpExpiresAt = null;
  user.otpSentAt = null;
  user.otpAttempts = 0;
};

const isOtpCoolingDown = (user) =>
  Boolean(user.otpSentAt) &&
  Date.now() - new Date(user.otpSentAt).getTime() < OTP_COOLDOWN_MS;

const checkOtp = (user, otp, purpose) => {
  const invalid = { error: "Invalid or expired code" };

  if (!user?.otpHash || user.otpPurpose !== purpose) {
    return invalid;
  }

  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    return { error: "Too many attempts. Request a new code." };
  }

  if (!user.otpExpiresAt || new Date(user.otpExpiresAt).getTime() < Date.now()) {
    return invalid;
  }

  const incoming = Buffer.from(hashOtp(otp));
  const stored = Buffer.from(user.otpHash);
  const matches =
    incoming.length === stored.length && crypto.timingSafeEqual(incoming, stored);

  if (!matches) {
    user.otpAttempts += 1;
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return { error: "Too many attempts. Request a new code.", failed: true };
    }
    return { ...invalid, failed: true };
  }

  return { ok: true };
};

module.exports = {
  assignOtp,
  clearOtp,
  isOtpCoolingDown,
  checkOtp,
};
