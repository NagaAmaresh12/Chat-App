import { Router } from "express";
import {
  login,
  me,
  logout,
  verifyOTP,
  // resetPassword,
  // forgetPassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import {
  loginSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from "../utils/joi.validate.js";

const router = Router();

// Step 1: Send OTP to email
router.post("/login", (req, res) => {
  res.send("login endpoint is working fine");
});

// Step 2: Verify OTP (login/registration)
router.post("/verify-otp", validateBody(verifyOtpSchema), verifyOTP);

// Forget & Reset password (optional in OTP flow)
// router.post(
//   "/forgot-password",
//   validateBody(forgotPasswordSchema),
//   forgetPassword
// );
// router.post(
//   "/reset-password",
//   validateBody(resetPasswordSchema),
//   resetPassword
// );

// Logout + session check
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

export default router;
