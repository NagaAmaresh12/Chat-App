import Joi from "joi";

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
  }),
  username: Joi.string().required().messages({
    "string.username": "Please enter a valid username.",
    "any.required": "username is required.",
  }),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
  }),
  otp: Joi.string().length(4).pattern(/^\d+$/).required().messages({
    "string.length": "OTP must be 4 digits.",
    "string.pattern.base": "OTP must contain only numbers.",
    "any.required": "OTP is required.",
  }),
  username: Joi.string().required().messages({
    "string.username": "Please enter a valid username",
    "any.required": "Username is Required",
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
  }),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters.",
    "any.required": "New password is required.",
  }),
});
