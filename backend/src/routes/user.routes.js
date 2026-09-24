const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
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

router.post("/signup", signUp);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);
router.post("/me/avatar/signature", requireAuth, signAvatar);
router.post("/me/avatar", requireAuth, confirmAvatar);
router.post("/send-otp/:id", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp/:id", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
