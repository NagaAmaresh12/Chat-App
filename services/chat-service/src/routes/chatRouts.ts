import { Router } from "express";
import {
  getChatsByUserID,
  createNewChat,
  getChatByChatID,
} from "../controllers/chat.controller.js";

const router = Router();

router.get("/:userID", authenticate, getChatsByUserID);
router.get("/new", authenticate, createNewChat);
router.get("/:chatID", authenticate, getChatByChatID);
router.delete("/delete/:chatID", authenticate, deleteChatByChatID);
router.delete("/edit/:chatID", authenticate, editChatByChatID);
export default router;
