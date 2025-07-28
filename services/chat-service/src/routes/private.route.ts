import { Router } from "express";
import {
  createNewprivateChat,
  getprivateChatsByUserID,
  getprivateChatByChatID,
  editprivateChatByChatID,
  deleteprivateChatByChatID,
} from "../controllers/private.controller.js";
import { validateBody, validateParams } from "../middlewares/index.js";
import { authenticate } from "../middlewares/index.js";
import {
  privateChatSchema,
  chatIDParamsSchema,
  editChatSchema,
} from "../utils/index.js";

const router = Router();
// Creating a 1-1 or group chat between users
router.post(
  "/new",
  authenticate,
  validateBody(privateChatSchema),
  createNewprivateChat
);

router.get("/my-chats", authenticate, getprivateChatsByUserID); // Fetch all chats for the user i want to APpy pagination here

router.get(
  "/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  getprivateChatByChatID //✅tested
);

router.patch(
  "/edit/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  validateBody(editChatSchema),
  editprivateChatByChatID
);
//✅tested

router.delete(
  "/delete/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  deleteprivateChatByChatID
);
//✅tested
export default router;
