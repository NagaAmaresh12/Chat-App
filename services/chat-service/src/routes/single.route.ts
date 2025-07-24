import { Router } from "express";
import {
  createNewSingleChat,
  getSingleChatsByUserID,
  getSingleChatByChatID,
  editSingleChatByChatID,
  deleteSingleChatByChatID,
} from "../controllers/single.controller.js";
import { validateBody, validateParams } from "../middlewares/index.js";
import { authenticate } from "../middlewares/index.js";
import {
  singleChatSchema,
  chatIDParamsSchema,
  editChatSchema,
} from "../utils/index.js";

const router = Router();
// Create a 1-1 or group chat between users
router.post(
  "/new",
  authenticate,
  validateBody(singleChatSchema),
  createNewSingleChat
);

router.get("/my-chats", authenticate, getSingleChatsByUserID); // Fetch all chats for the user

router.get(
  "/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  getSingleChatByChatID
);

router.delete(
  "/delete/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  deleteSingleChatByChatID
);

router.patch(
  "/edit/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  validateBody(editChatSchema),
  editSingleChatByChatID
);

export default router;
