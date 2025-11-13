import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  getUserByID,
  getAllUsers,
  updateUserByID,
  getUsersByBatch,
  getAllUsersPage,
} from "../controllers/user.controller.js";

const router = Router();

// Step 1: Send OTP to email ✅[TEST WITH POSTMAN]
router.get("/all", authenticate, getAllUsersPage);

router.get("/:userID", authenticate, getUserByID); //✅[TEST WITH POSTMAN]
router.post("/batch", authenticate, getUsersByBatch); //req.body array of users
router.patch("/edit/:userID", authenticate, updateUserByID); // ✅[TEST WITH POSTMAN]

export default router;
