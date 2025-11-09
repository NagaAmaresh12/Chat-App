import { Router } from "express";
import {
  createNewPrivateChat,
  getprivateChatsByUserID,
  getPrivateChatByChatID,
  editprivateChatByChatID,
  deleteprivateChatByChatID,
} from "../controllers/index.js";
import { validateBody, validateParams } from "../middlewares/index.js";
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
  validateBody(privateChatSchema),
  createNewPrivateChat
);
// ===================================== Read All Message ============================
router.get("/my-chats", getprivateChatsByUserID); // Fetch all chats for the user i want to APpy pagination here
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
  validateParams(chatIDParamsSchema),
  getPrivateChatByChatID //✅tested
);
// ===================================== Update Message my ChatID ============================
router.patch(
  "/edit/:chatID",
  validateParams(chatIDParamsSchema),
  validateBody(editChatSchema),
  editprivateChatByChatID
);
//✅tested
// ===================================== Delete Message my ChatID ============================
router.delete(
  "/delete/:chatID",
  validateParams(chatIDParamsSchema),
  deleteprivateChatByChatID
);
//✅tested
export default router;
