import { Router } from "express";
import {
  login,
  me,
  logout,
  verifyOTP,
  refreshToken,
  verifyToken,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { loginSchema, verifyOtpSchema } from "../utils/joi.validate.js";

const router = Router();

// Step 1: Send OTP to email ✅[TEST WITH POSTMAN]
router.post("/login", validateBody(loginSchema), login);

// Step 2: Verify OTP (login/registration) ✅[TEST WITH POSTMAN]
router.post("/verify-otp", validateBody(verifyOtpSchema), verifyOTP);

// Logout + session check  ✅[TEST WITH POSTMAN]
router.post("/logout", authenticate, logout);
//me  ✅[TEST WITH POSTMAN]
router.get("/me", authenticate, me);
router.get("/verify-token", verifyToken);
//generate access token for other service

//refresh Token End-Point Needed This would be handled by Middleware just call /me route
router.get("/refresh-token", authenticate, refreshToken);
export default router;
