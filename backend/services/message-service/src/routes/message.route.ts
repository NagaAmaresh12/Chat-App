import express from "express";
import {
  createMessage,
  getMessageById,
  getMessages,
  updateMessage,
  deleteMessage,
  forwardMessage,
  addReaction,
  markAsRead,
  removeReaction,
  searchMessages,
  bulkDeleteMessages,
} from "../controllers/message.controller.js";

import { rateLimiter } from "../middlewares/ratelimit.middleware.js";
import { validateJoiBody } from "../middlewares/validation.middleware.js";
import { createMessageSchema } from "../utils/joi.validate.js";

const router = express.Router();


// Create a new message
router.post(
  "/create",
  validateJoiBody(createMessageSchema),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 messages per 15 minutes
  createMessage
);

// Get messages for a chat with pagination
router.get(
  "/chat/:chatId",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }), // 200 requests per 15 minutes
  getMessages
);

// Get single message by ID
router.get(
  "/:messageId",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 300 }), // 300 requests per 15 minutes
  getMessageById
);

// Update/Edit a message
router.put(
  "/:messageId",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 edits per 15 minutes
  updateMessage
);

// Delete a message
router.delete(
  "/:messageId",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 deletes per 15 minutes
  deleteMessage
);

// Forward message(s)
router.post(
  "/forward",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 forwards per 15 minutes
  forwardMessage
);

// Mark messages as read
router.patch(
  "/read",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 300 }), // 300 read updates per 15 minutes
  markAsRead
);

// Add reaction to message
router.post(
  "/reactions",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }), // 200 reactions per 15 minutes
  addReaction
);

// Remove reaction from message
router.delete(
  "/reactions",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }), // 200 reaction removals per 15 minutes
  removeReaction
);

// Search messages
router.get(
  "/search/query",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 searches per 15 minutes
  searchMessages
);

// Bulk delete messages
router.delete(
  "/bulk",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 bulk deletes per 15 minutes
  bulkDeleteMessages
);

export default router;
