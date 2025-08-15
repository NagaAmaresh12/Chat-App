import { Router } from "express";
import {
  createNewprivateChat,
  getprivateChatsByUserID,
  getprivateChatByChatID,
  editprivateChatByChatID,
  deleteprivateChatByChatID,
} from "../controllers/index.js";
import { validateBody, validateParams } from "../middlewares/index.js";
import { authenticate } from "../middlewares/index.js";
import {
  privateChatSchema,
  chatIDParamsSchema,
  editChatSchema,
} from "../utils/index.js";

const router = Router();
// Creating a 1-1 or group chat between users
//✅tested
// ===================================== Create NEW Message ============================
router.post(
  "/new",
  authenticate,
  validateBody(privateChatSchema),
  createNewprivateChat
);
// ===================================== Read All Message ============================
router.get("/my-chats", authenticate, getprivateChatsByUserID); // Fetch all chats for the user i want to APpy pagination here
//✅tested
// router.patch(
//   "/last-message/:chatID",
//   authenticate,
//   validateBody(),
//   editLastMessageByChatID
// );
// ===================================== Read single Message By ChatID ============================
router.get(
  "/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  getprivateChatByChatID //✅tested
);
// ===================================== Update Message my ChatID ============================
router.patch(
  "/edit/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  validateBody(editChatSchema),
  editprivateChatByChatID
);
//✅tested
// ===================================== Delete Message my ChatID ============================
router.delete(
  "/delete/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  deleteprivateChatByChatID
);
//✅tested
export default router;
