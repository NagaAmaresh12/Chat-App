import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  getUserByID,
  getAllUsers,
  updateUserByID,
} from "../controllers/user.controller.js";

const router = Router();

// Step 1: Send OTP to email
router.get("/:userID", authenticate, getUserByID);
router.get("/all", authenticate, getAllUsers);
router.patch("/:userID", authenticate, updateUserByID);

export default router;
