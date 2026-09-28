const createOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpiresAt = Date.now() + 10 * 60 * 1000;
  return { otp, otpExpiresAt };
};

module.exports = createOtp;
