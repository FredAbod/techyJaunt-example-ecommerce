const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  signUpSchema,
  loginSchema,
  userIdParamSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
  confirmAvatarSchema,
} = require("../validators/user.validators");
const {
  signUp,
  login,
  sendOtp,
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
router.post("/send-otp/:id", validate(userIdParamSchema, "params"), sendOtp);
router.post("/verify-otp", validate(otpSchema), verifyOtp);
router.post("/resend-otp/:id", validate(userIdParamSchema, "params"), resendOtp);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

module.exports = router;
