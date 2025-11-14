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
// Schema for updating user
export const updateUserSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .trim()
    .messages({
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username cannot exceed 30 characters",
    })
    .optional(),

  email: Joi.string()
    .email({ tlds: { allow: false } }) // allow any TLD
    .messages({
      "string.email": "Please provide a valid email address",
    })
    .optional(),

  bio: Joi.string()
    .max(200)
    .trim()
    .messages({
      "string.max": "Bio cannot exceed 200 characters",
    })
    .optional(),

  avatar: Joi.string()
    .uri()
    .messages({
      "string.uri": "Avatar must be a valid URL",
    })
    .optional(),
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
