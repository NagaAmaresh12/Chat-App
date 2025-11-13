import { Router } from "express";
import {
  getArchivedChatsByUserID,
  getAllChatsByUserID,
  getAllChatsByUserIDPage,
} from "../controllers/index.js";
const router = Router();
router.get("/all-chats", getAllChatsByUserIDPage); // Fetch all chats for the user i want to APpy pagination here
router.get("/archived-chats", getArchivedChatsByUserID);
export default router;
