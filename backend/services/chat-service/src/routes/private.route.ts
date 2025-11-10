import { Router } from "express";
import {
  createNewPrivateChat,
  getPrivateChatsByUserID,
  getPrivateChatByChatID,
  editPrivateChatByChatID,
  deletePrivateChatByChatID,
} from "../controllers/index.js";
import { validateBody, validateParams } from "../middlewares/index.js";
import {
  privateChatSchema,
  chatIDParamsSchema,
  editChatSchema,
} from "../utils/index.js";

const router = Router();
// ===================================== Create NEW Message ============================

router.post(
  "/new",
  validateBody(privateChatSchema),
  createNewPrivateChat
);

// ===================================== Read All Message ============================

router.get("/my-private", getPrivateChatsByUserID); 

// ===================================== Read single Message By ChatID ============================

router.get(
  "/:chatID",
  validateParams(chatIDParamsSchema),
  getPrivateChatByChatID 
);

// ===================================== Update Message my ChatID ============================

router.put(
  "/edit/:chatID",
  validateParams(chatIDParamsSchema),
  validateBody(editChatSchema),
  editPrivateChatByChatID
);

// ===================================== Delete Message my ChatID ============================

router.delete(
  "/delete/:chatID",
  validateParams(chatIDParamsSchema),
  deletePrivateChatByChatID
);

export default router;
