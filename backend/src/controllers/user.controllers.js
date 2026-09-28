const User = require("../models/user.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const toPublicUser = require("../helpers/publicUser");
const createOtp = require("../helpers/otp");
const { sendOtpEmail, sendLoginAlertEmail } = require("../helpers/userEmails");
const {
  isConfigured,
  signUpload,
  destroyAsset,
  assertOwnedImage,
} = require("../helpers/cloudinary");

const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
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
      { expiresIn: "1h" },
    );

    await sendLoginAlertEmail(user, new Date().toUTCString());

    return res
      .status(200)
      .json({ message: "Login successful", user: toPublicUser(user), token });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const sendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const { otp, otpExpiresAt } = createOtp();
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
    const user = await User.findOne({ otp });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (String(user.otp) !== String(otp)) {
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
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const { otp, otpExpiresAt } = createOtp();
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendOtpEmail(user, otp, {
      subject: "Your verification code",
      heading: "Verify your email",
      purpose: "verify your email address",
    });

    return res.status(200).json({
      message: "OTP sent successfully",
      otp,
      otpExpiresAt,
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

    const { otp, otpExpiresAt } = createOtp();
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendOtpEmail(user, otp, {
      subject: "Your password reset code",
      heading: "Reset your password",
      purpose: "reset your password",
    });

    return res.status(200).json({
      message: "OTP sent successfully",
      otp,
      otpExpiresAt,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  const { otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ otp });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.otpExpiresAt < Date.now()) {
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
      req.user.firstName = firstName;
    }
    if (lastName !== undefined) {
      req.user.lastName = lastName;
    }
    if (phone !== undefined) {
      req.user.phone = phone === "" ? null : phone;
    }
    if (address !== undefined) {
      req.user.address = {
        line1: address.line1 ?? req.user.address?.line1 ?? "",
        city: address.city ?? req.user.address?.city ?? "",
        state: address.state ?? req.user.address?.state ?? "",
        country: address.country ?? req.user.address?.country ?? "",
        postalCode: address.postalCode ?? req.user.address?.postalCode ?? "",
      };
    }

    await req.user.save();
    // const user = await User.findByIdAndUpdate(req.user._id, { $set: req.body }, { new: true });
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

  return res.status(200).json(signUpload(`avatars/${req.user._id}`));
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
