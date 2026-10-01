const Joi = require("joi");

const addressSchema = Joi.object({
  line1: Joi.string().trim().max(120).allow(""),
  city: Joi.string().trim().max(80).allow(""),
  state: Joi.string().trim().max(80).allow(""),
  country: Joi.string().trim().max(80).allow(""),
  postalCode: Joi.string().trim().max(20).allow(""),
}).unknown(false);

const signUpSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(1).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(1).required(),
});

const otpField = Joi.alternatives()
  .try(
    Joi.string().trim().pattern(/^\d{6}$/),
    Joi.number().integer().min(100000).max(999999),
  )
  .required();

const verifyOtpSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  otp: otpField,
});

const resendOtpSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  otp: otpField,
  newPassword: Joi.string().min(1).required(),
});

const updateMeSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50),
  lastName: Joi.string().trim().min(1).max(50),
  phone: Joi.string().trim().max(20).allow(null, ""),
  address: addressSchema,
})
  .min(1)
  .messages({
    "object.min": "No valid fields to update",
  });

const confirmAvatarSchema = Joi.object({
  publicId: Joi.string().trim().min(1).max(200).required(),
});

module.exports = {
  signUpSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
  confirmAvatarSchema,
};
