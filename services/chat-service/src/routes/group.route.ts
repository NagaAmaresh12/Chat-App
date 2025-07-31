import { Router } from "express";
import {
  createNewGroupChat,
  getGroupChatByChatID,
  editGroupChatByChatID,
  deleteGroupChatByChatID,
  addMemberInGroupChat,
  removeMemberInGroupChat,
  getMyGroupChats,
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

router.get("/my-groups", authenticate, getMyGroupChats); //✅tested

router.get(
  "/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  getGroupChatByChatID
); //✅tested

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
); //✅tested
router.delete(
  "/delete/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  //   validateBody(deleteGroupSchema),
  deleteGroupChatByChatID
); //✅tested //setting isActive to false but keeping user data in group chat so,
//  that particular chat will not be listed to that user

router.put(
  "/add-member/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  validateBody(addMemberSchema),
  addMemberInGroupChat
); //✅tested // this is possible to add a non-existing user in chat

router.delete(
  "/remove-member/:chatID",
  authenticate,
  validateParams(chatIDParamsSchema),
  validateBody(removeMemberSchema),
  removeMemberInGroupChat
); //setting isActive to false but keeping user data
//✅tested
export default router;
