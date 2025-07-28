import { Router } from "express";
import { authenticate } from "../middlewares/index.js";
import {
  getMessageBymsgID,
  createNewMessage,
  getMessageThreadByMsgID,
  getMessagesByChatID,
  editMessageByMsgID,
  deleteMessageByMsgID,
  replyMsgByMessageID,
  forwardMsgByMessageID,
  postReactionsBymsgID,
  getMsgStatusByMsgID,
} from "../controllers/message.controller.js";
const router = Router();
router.post("/create", authenticate, createNewMessage);
router.get("/:msgID", authenticate, getMessageBymsgID);
router.get("/status/:msg", authenticate, getMsgStatusByMsgID);
router.post("/reactions/:msgID/", authenticate, postReactionsBymsgID);
router.post("/reply/:msgID", authenticate, replyMsgByMessageID);
router.post("/forward/:msgID", authenticate, forwardMsgByMessageID);
router.patch("/edit/:msgID", authenticate, editMessageByMsgID);
router.delete("/delete/:msgID", authenticate, deleteMessageByMsgID);
router.get("/thread/:msgID", authenticate, getMessageThreadByMsgID);
export default router;
