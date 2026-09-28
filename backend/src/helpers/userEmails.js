const sendEmail = require("./email");

const sendOtpEmail = (user, otp, { subject, heading, purpose }) =>
  sendEmail({
    to: user.email,
    subject,
    template: "otp",
    text: `Hi ${user.firstName}, your code is ${otp}. Use it to ${purpose}. It expires in 10 minutes.`,
    data: {
      firstName: user.firstName,
      otp,
      heading,
      purpose,
      expiresInMinutes: 10,
    },
  });

const sendLoginAlertEmail = (user, loginTime) =>
  sendEmail({
    to: user.email,
    subject: "Someone just signed in to your account",
    template: "login-alert",
    text: `Hi ${user.firstName}, someone just signed in to your TechyJaunt account (${user.email}) at ${loginTime}. If this was not you, reset your password.`,
    data: {
      firstName: user.firstName,
      email: user.email,
      loginTime,
    },
  });

module.exports = { sendOtpEmail, sendLoginAlertEmail };
