import Joi from "joi";
import mongoose from "mongoose";

// Custom ObjectId validation
const objectIdValidation = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

// Attachment validation schema -- OLD
// const attachmentSchema = Joi.object({
//   type: Joi.string().valid("image", "video", "audio", "document").required(),
//   url: Joi.string().uri().required(),
//   filename: Joi.string().min(1).max(255).required(),
//   size: Joi.number()
//     .positive()
//     .max(100 * 1024 * 1024)
//     .required(), // Max 100MB
//   mimeType: Joi.string().required(),
//   thumbnailUrl: Joi.string().uri().optional(),
// });

// Reply to schema
const replyToSchema = Joi.object({
  messageId: objectIdValidation.required(),
  senderId: objectIdValidation.required(),
  content: Joi.string().max(200).required(),
  messageType: Joi.string().valid("text", "media", "emoji").required(),
});

export const getMessageSchemaByChatID = Joi.object({
  chatType: Joi.string().valid("private", "group"),
});
export const getMessageSchemaByMsgID = Joi.object({
  chatType: Joi.string().valid("private", "group"),
});
export const editMessageSchemaByMsgID = Joi.object({
  content: Joi.string(),
});
export const deleteMessageSchemaByMsgID = Joi.object({
  deleteForEveryone: Joi.boolean(),
});

// Create message validation -- OLD
// export const createMessageSchema = Joi.object({
//   chatId: objectIdValidation.required(),
//   chatType: Joi.string().valid("private", "group").required(),
//   messageType: Joi.string()
//     .valid("text", "image", "video", "audio", "document", "emoji")
//     .default("text"),

//   content: Joi.string().max(4000).optional(),

//   // Don't require attachments here — multer handles them
//   attachments: Joi.any().optional(),

//   replyTo: replyToSchema.optional(),
// });

// Attachment validation schema -- NEW
export const attachmentSchema = Joi.object({
  url: Joi.string().uri().required(),
  filename: Joi.string().required(),
  size: Joi.number().required(),
  mimeType: Joi.string().required(),
  type: Joi.string().valid("image", "video", "audio", "document").required(),
  thumbnailUrl: Joi.string().uri().optional(),
});
// Create message validation -- NEW
export const createMessageSchema = Joi.object({
  chatId: objectIdValidation.required(),
  chatType: Joi.string().valid("private", "group").required(),
  messageType: Joi.string()
    .valid("text", "image", "video", "audio", "document", "emoji")
    .default("text"),

  // ✅ Fix: Allow empty string OR make it truly optional when not present
  content: Joi.string()
    .allow("", null) // Allow empty string and null
    .max(4000)
    .optional(),

  attachments: Joi.array().items(attachmentSchema).optional(),
  replyTo: replyToSchema.optional(),
})
  // ✅ Add custom validation: must have either content or attachments
  .custom((value, helpers) => {
    const hasContent = value.content && value.content.trim().length > 0;
    const hasAttachments = value.attachments && value.attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      return helpers.error("any.custom", {
        message: "Must provide either content or attachments",
      });
    }

    return value;
  });

// Update message validation
export const updateMessageSchema = Joi.object({
  content: Joi.string().max(4000).required(),
  editedAt: Joi.date().default(new Date()),
}).custom((value, helpers) => {
  // Only text and emoji messages can be edited
  return value;
});

// Forward message validation
export const forwardMessageSchema = Joi.object({
  originalMessageId: objectIdValidation.required(),
  targetChatIds: Joi.array()
    .items(objectIdValidation)
    .min(1)
    .max(20)
    .required(), // Max 20 forwards at once
  senderId: objectIdValidation.required(),
});

// Get messages validation By ChatID
export const getMessagesSchema = Joi.object({
  chatId: objectIdValidation.required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  before: objectIdValidation.optional(), // Message ID to get messages before this
  after: objectIdValidation.optional(), // Message ID to get messages after this
  search: Joi.string().max(100).optional(),
  messageType: Joi.string()
    .valid("text", "image", "video", "audio", "document", "emoji")
    .optional(),
});
export const getAllChatsByUserIDSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  search: Joi.string().allow("").optional(),
});

// Delete message validation
export const deleteMessageSchema = Joi.object({
  messageId: objectIdValidation.required(),
  deletedBy: objectIdValidation.required(),
  deleteForEveryone: Joi.boolean().default(false),
});

// Mark as read validation

export const markAsReadSchema = Joi.object({
  messageIds: Joi.array()
    .items(objectIdValidation) // your existing ObjectId validation
    .min(1)
    .max(100)
    .required(),
});

// Add reaction validation
export const addReactionSchema = Joi.object({
  messageId: objectIdValidation.required(),
  emoji: Joi.string().min(1).max(10).required(), // Support unicode emojis
});

// Remove reaction validation
export const removeReactionSchema = Joi.object({
  messageId: objectIdValidation.required(),
});

// Search messages validation
export const searchMessagesSchema = Joi.object({
  chatId: objectIdValidation.optional(),
  query: Joi.string().min(1).max(100).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(20).default(10),
  messageType: Joi.string()
    .valid("text", "image", "video", "audio", "document", "emoji")
    .optional(),
  senderId: objectIdValidation.optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
});

// Bulk delete validation
export const bulkDeleteSchema = Joi.object({
  messageIds: Joi.array().items(objectIdValidation).min(1).max(100).required(),
  deleteForEveryone: Joi.boolean().default(false),
});
