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
import { loginSchema, verifyOtpSchema } from "../utils/joi.validate.js";

const router = Router();

// Step 1: Send OTP to email ✅[TEST WITH POSTMAN]
router.post("/login", validateBody(loginSchema), login);

// Step 2: Verify OTP (login/registration) ✅[TEST WITH POSTMAN]
router.post("/verify-otp", validateBody(verifyOtpSchema), verifyOTP);

// Logout + session check
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

export default router;
