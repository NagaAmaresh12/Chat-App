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
  userIDParamsSchema,
  chatIDParamsSchema,
  editChatSchema,
} from "../utils/index.js";

const router = Router();

router.post(
  "/new",
  authenticate,
  validateBody(singleChatSchema),
  createNewSingleChat
);
router.get(
  "/:userID",
  authenticate,
  validateParams(userIDParamsSchema),
  getSingleChatsByUserID
);
router.get(
  "/:chatID",
  authenticate,
  validateBody(chatIDParamsSchema),
  getSingleChatByChatID
);
router.delete(
  "/delete/:chatID",
  authenticate,
  validateBody(chatIDParamsSchema),
  deleteSingleChatByChatID
);
router.patch(
  "/edit/:chatID",
  authenticate,
  validateBody(editChatSchema),
  editSingleChatByChatID
);
export default router;
