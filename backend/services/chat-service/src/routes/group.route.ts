import { Router } from "express";
import {
  createNewGroupChat,
  getGroupChatByChatID,
  editGroupChatByChatID,
  deleteGroupChatByChatID,
  addMemberInGroupChat,
  removeMemberInGroupChat,
  getMyGroupChats,
} from "../controllers/index.js";
import {
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
  validateBody(groupChatSchema),
  createNewGroupChat
); //✅tested

router.get("/my-group", getMyGroupChats); //✅tested

router.get(
  "/:chatID",
  validateParams(chatIDParamsSchema),
  getGroupChatByChatID
); //✅tested


router.put(
  "/edit/:chatID",
  validateParams(chatIDParamsSchema),
  validateBody(editGroupSchema),
  editGroupChatByChatID
); //✅tested

router.delete(
  "/delete/:chatID",
  validateParams(chatIDParamsSchema),
  deleteGroupChatByChatID
); //✅tested //setting isActive to false but keeping user data in group chat so,
//  that particular chat will not be listed to that user

router.put(
  "/add-member/:chatID",
  validateParams(chatIDParamsSchema),
  validateBody(addMemberSchema),
  addMemberInGroupChat
); //✅tested // this is possible to add a non-existing user in chat

router.delete(
  "/remove-member/:chatID",
  validateParams(chatIDParamsSchema),
  validateBody(removeMemberSchema),
  removeMemberInGroupChat
); //setting isActive to false but keeping user data
// ====================================== Join Group BY UserID ==============================
// router.post('/join-group',authenticate,validateBody(),joinGroupByUserID)
//✅tested
export default router;
