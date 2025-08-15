import { Router } from "express";
import { authenticate } from "../middlewares/index.js";
import {
  getArchivedChatsByUserID,
  getAllChatsByUserID,
} from "../controllers/index.js";
const router = Router();
router.get("/all-chats", authenticate, getAllChatsByUserID); // Fetch all chats for the user i want to APpy pagination here
router.get("/archived-chats", authenticate, getArchivedChatsByUserID);
export default router;
