import express, { NextFunction } from "express";
import {
  createMessage,
  getMessageByMsgId,
  getMessagesByChatID,
  updateMessage,
  deleteMessage,
  forwardMessage,
  addReaction,
  markAsRead,
  removeReaction,
  // searchMessages,
  bulkDeleteMessages,
} from "../controllers/message.controller.js";

import { rateLimiter } from "../middlewares/ratelimit.middleware.js";
import {
  validateJoiBody,
  validateParams,
} from "../middlewares/validation.middleware.js";
import {
  createMessageSchema,
  getMessageSchemaByChatID,
  getMessageSchemaByMsgID,
  editMessageSchemaByMsgID,
  deleteMessageSchemaByMsgID,
  markAsReadSchema,
  addReactionSchema,
  bulkDeleteSchema,
} from "../utils/joi.validate.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();
// Conditional multer middleware
const conditionalMulter = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const contentType = req.headers["content-type"] || "";

  // Only use multer for multipart/form-data
  if (contentType.includes("multipart/form-data")) {
    return upload.array("attachments", 10)(req, res, next);
  }

  // For JSON requests, skip multer
  next();
};
// Updated route
router.post(
  "/create",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  conditionalMulter,
  validateJoiBody(createMessageSchema),
  createMessage
);

// Get messages for a chat with pagination
router.get(
  "/chatId/:chatId",
  validateJoiBody(getMessageSchemaByChatID),
  // rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }), // 200 requests per 15 minutes
  getMessagesByChatID
);

// Get single message by ID
router.get(
  "/msgId/:messageId",
  // validateJoiBody(getMessageSchemaByMsgID),
  // rateLimiter({ windowMs: 15 * 60 * 1000, max: 300 }), // 300 requests per 15 minutes
  getMessageByMsgId
);

// Update/Edit a message
router.put(
  "/edit/:messageId",
  validateJoiBody(editMessageSchemaByMsgID),
  // rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 edits per 15 minutes
  updateMessage
);

// Delete a message
router.delete(
  "/delete/:messageId",
  validateJoiBody(deleteMessageSchemaByMsgID),
  // rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 deletes per 15 minutes
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
  validateJoiBody(markAsReadSchema),
  // rateLimiter({ windowMs: 15 * 60 * 1000, max: 300 }), // 300 read updates per 15 minutes
  markAsRead
);

// Add reaction to message
router.patch(
  "/add/reactions",
  validateJoiBody(addReactionSchema),
  // rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }), // 200 reactions per 15 minutes
  addReaction
);

// Remove reaction from message
router.delete(
  "/remove/reactions",
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }), // 200 reaction removals per 15 minutes
  removeReaction
);

// // Search messages
// router.get(
//   "/search/query",
//   rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 searches per 15 minutes
//   searchMessages
// );

// // Bulk delete messages
router.delete(
  "/bulk",
  validateJoiBody(bulkDeleteSchema),
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 bulk deletes per 15 minutes
  bulkDeleteMessages
);

//optional
// router.use((err: any, _req: any, res: any, _next: any) => {
//   if (
//     err instanceof multer.MulterError ||
//     err.message.includes("Invalid file type")
//   ) {
//     return res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//   }
//   res.status(500).json({ success: false, message: "Internal Server Error" });
// });

export default router;
