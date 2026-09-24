const User = require("../models/user.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../helpers/email");
const toPublicUser = require("../helpers/publicUser");
const {
  isConfigured,
  signUpload,
  destroyAsset,
  assertOwnedImage,
} = require("../helpers/cloudinary");
require("dotenv").config();

const ADDRESS_LIMITS = {
  line1: 120,
  city: 80,
  state: 80,
  country: 80,
  postalCode: 20,
};

const pickAddress = (input, current = {}) => {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Invalid address" };
  }

  const next = {
    line1: current.line1 || "",
    city: current.city || "",
    state: current.state || "",
    country: current.country || "",
    postalCode: current.postalCode || "",
  };

  for (const key of Object.keys(input)) {
    if (!Object.prototype.hasOwnProperty.call(ADDRESS_LIMITS, key)) {
      return { error: "Invalid address" };
    }
    if (typeof input[key] !== "string") {
      return { error: "Invalid address" };
    }
    const value = input[key].trim();
    if (value.length > ADDRESS_LIMITS[key]) {
      return { error: "Invalid address" };
    }
    next[key] = value;
  }

  return { address: next };
};

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

const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      !firstName.trim() ||
      !lastName.trim() ||
      firstName.trim().length > 50 ||
      lastName.trim().length > 50 ||
      !email ||
      !password
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      password: hashedPassword,
    });
    return res
      .status(201)
      .json({ message: "User created successfully", user: toPublicUser(newUser) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "User is not verified" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    const loginTime = new Date().toUTCString();
    await sendEmail({
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

    return res
      .status(200)
      .json({ message: "Login successful", user: toPublicUser(user), token: token });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const sendOtp = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendOtpEmail(user, otp, {
      subject: "Your verification code",
      heading: "Verify your email",
      purpose: "verify your email address",
    });
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ otp: otp });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    return res.status(200).json({ message: "Email verified successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resendOtp = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();
    await sendOtpEmail(user, otp, {
      subject: "Your verification code",
      heading: "Verify your email",
      purpose: "verify your email address",
    });
    return res
      .status(200)
      .json({
        message: "OTP sent successfully",
        otp: otp,
        otpExpiresAt: otpExpiresAt,
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (!user.isVerified) {
      return res.status(400).json({ message: "User is not verified" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();
    await sendOtpEmail(user, otp, {
      subject: "Your password reset code",
      heading: "Reset your password",
      purpose: "reset your password",
    });
    return res
      .status(200)
      .json({
        message: "OTP sent successfully",
        otp: otp,
        otpExpiresAt: otpExpiresAt,
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
    const { otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ otp: otp });
        if(!user){
            return res.status(400).json({ message: "User not found" });
        }
    if(user.otpExpiresAt < Date.now()){
        return res.status(400).json({ message: "OTP expired" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({ user: toPublicUser(req.user) });
};

const updateMe = async (req, res) => {
  const { firstName, lastName, phone, address } = req.body;

  try {
    if (firstName !== undefined) {
      if (typeof firstName !== "string" || !firstName.trim() || firstName.trim().length > 50) {
        return res.status(400).json({ message: "Invalid first name" });
      }
      req.user.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== "string" || !lastName.trim() || lastName.trim().length > 50) {
        return res.status(400).json({ message: "Invalid last name" });
      }
      req.user.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      if (phone !== null && typeof phone !== "string") {
        return res.status(400).json({ message: "Invalid phone" });
      }
      const value = phone === null ? "" : phone.trim();
      if (value.length > 20) {
        return res.status(400).json({ message: "Invalid phone" });
      }
      req.user.phone = value || null;
    }

    if (address !== undefined) {
      const picked = pickAddress(address, req.user.address || {});
      if (picked.error) {
        return res.status(400).json({ message: picked.error });
      }
      req.user.address = picked.address;
    }

    if (
      firstName === undefined &&
      lastName === undefined &&
      phone === undefined &&
      address === undefined
    ) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    await req.user.save();
    return res.status(200).json({ message: "Profile updated", user: toPublicUser(req.user) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const signAvatar = async (req, res) => {
  if (!isConfigured()) {
    return res.status(500).json({ message: "Image upload is not configured" });
  }

  const folder = `avatars/${req.user._id}`;
  return res.status(200).json(signUpload(folder));
};

const confirmAvatar = async (req, res) => {
  if (!isConfigured()) {
    return res.status(500).json({ message: "Image upload is not configured" });
  }

  try {
    const folder = `avatars/${req.user._id}`;
    const result = await assertOwnedImage(req.body.publicId, folder);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    const previous = req.user.profilePicturePublicId;
    req.user.profilePictureUrl = result.image.url;
    req.user.profilePicturePublicId = result.image.publicId;
    await req.user.save();

    if (previous && previous !== result.image.publicId) {
      try {
        await destroyAsset(previous);
      } catch (error) {
        console.log(error);
      }
    }

    return res
      .status(200)
      .json({ message: "Profile picture updated", user: toPublicUser(req.user) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
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
};
