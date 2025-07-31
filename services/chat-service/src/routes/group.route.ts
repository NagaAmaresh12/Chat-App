import { Router } from "express";
import {
  createNewGroupChat,
  getGroupChatByChatID,
  editGroupChatByChatID,
  deleteGroupChatByChatID,
  addMemberInGroupChat,
  removeMemberInGroupChat,
} from "../controllers/group.controller.js";
import {
  authenticate,
  validateBody,
  validateParams,
} from "../middlewares/index.js";
import {
  chatIDParamsSchema,
  groupChatSchema,
  addMemberSchema,
  editGroupSchema,
  removeMemberSchema,
} from "../utils/index.js";

const router = Router();
router.post(
  "/new",
  authenticate,
  validateBody(groupChatSchema),
  createNewGroupChat
); //✅tested

router.get("/my-groups", authenticate, getGroupChatByChatID);

router.get(
  "/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  getGroupChatByChatID
);

router.delete(
  "/delete/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  deleteGroupChatByChatID
);

router.put(
  "/edit/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  validateBody(editGroupSchema),
  editGroupChatByChatID
);
router.delete(
  "/delete/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  //   validateBody(deleteGroupSchema),
  deleteGroupChatByChatID
);

router.put(
  "/add-member/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  validateBody(addMemberSchema),
  addMemberInGroupChat
);

router.delete(
  "/remove-member/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  validateBody(removeMemberSchema),
  removeMemberInGroupChat
);

export default router;
