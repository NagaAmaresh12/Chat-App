import { Router } from "express";
import { authenticate } from "../middlewares/index.js";

import {
  validateSchema,
  validateFileUpload,
  validateChatMembership,
  validateMessageOwnership,
  rateLimitMessages,
} from "../middlewares/validation.middleware.js";

import {
  createMessageSchema,
  editMessageSchema,
  replyMessageSchema,
  forwardMessageSchema,
  postReactionSchema,
  getMessagesByChatSchema,
  getMessageByIdSchema,
  getMessageStatusSchema,
  deleteMessageSchema,
  getMessageThreadSchema,
} from "../utils/index.js";
import {
  createNewMessage,
  getMessageBymsgID,
  getMessageThreadByMsgID,
  getMessagesByChatID,
  getMsgStatusByMsgID,
  editMessageByMsgID,
  replyMsgByMessageID,
  forwardMsgByMessageID,
  deleteMessageByMsgID,
  postReactionsBymsgID,
  markMessageAsDelivered,
  markMessageAsRead,
} from "../controllers/message.controller.js";

const router = Router();

// Create a new message
router.post(
  "/create",
  authenticate,
  rateLimitMessages,
  // validateSchema(createMessageSchema),
  validateFileUpload,
  validateChatMembership,
  createNewMessage
);

// Get message by ID
router.get(
  "/:msgID",
  authenticate,
  validateSchema(getMessageByIdSchema),
  getMessageBymsgID
);

// Get messages by chat ID with pagination
router.get(
  "/chat/:chatId",
  authenticate,
  validateSchema(getMessagesByChatSchema),
  validateChatMembership,
  getMessagesByChatID
);

// Get message delivery status
router.get(
  "/status/:msgID",
  authenticate,
  validateSchema(getMessageStatusSchema),
  getMsgStatusByMsgID
);

// Add or remove reaction to message
router.post(
  "/reactions/:msgID",
  authenticate,
  validateSchema(postReactionSchema),
  postReactionsBymsgID
);

// Reply to a message within the "same chat"
router.post(
  "/reply/:msgID",
  authenticate,
  rateLimitMessages,
  validateSchema(replyMessageSchema),
  validateFileUpload,
  validateChatMembership,
  replyMsgByMessageID
);

// Forward message to "multiple chats"
router.post(
  "/forward/:msgID",
  authenticate,
  validateSchema(forwardMessageSchema),
  forwardMsgByMessageID
);

// Edit message (only text messages, within 15 minutes)
router.patch(
  "/edit/:msgID",
  authenticate,
  validateSchema(editMessageSchema),
  validateMessageOwnership,
  editMessageByMsgID
);

// Delete message (soft delete for user, or delete for everyone)
router.delete(
  "/delete/:msgID",
  authenticate,
  validateSchema(deleteMessageSchema),
  validateMessageOwnership,
  deleteMessageByMsgID
);

// Get message thread (replies to a message)
router.get(
  "/thread/:msgID",
  authenticate,
  validateSchema(getMessageThreadSchema),
  getMessageThreadByMsgID
);

// Mark message as delivered (for read receipts)
router.patch(
  "/delivered/:msgID",
  authenticate,
  validateSchema(getMessageByIdSchema),
  markMessageAsDelivered
);

// Mark message as read (for read receipts)
router.patch(
  "/read/:msgID",
  authenticate,
  validateSchema(getMessageByIdSchema),
  markMessageAsRead
);

export default router;
