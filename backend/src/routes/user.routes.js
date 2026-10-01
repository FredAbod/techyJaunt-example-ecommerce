const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  signUpSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
  confirmAvatarSchema,
} = require("../validators/user.validators");
const {
  signUp,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  signAvatar,
  confirmAvatar,
} = require("../controllers/user.controllers");

router.post("/signup", validate(signUpSchema), signUp);
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, validate(updateMeSchema), updateMe);
router.post("/me/avatar/signature", requireAuth, signAvatar);
router.post(
  "/me/avatar",
  requireAuth,
  validate(confirmAvatarSchema),
  confirmAvatar,
);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), resendOtp);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

module.exports = router;
