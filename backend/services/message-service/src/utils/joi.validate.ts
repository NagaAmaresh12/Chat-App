import Joi from "joi";
import mongoose from "mongoose";

// Custom ObjectId validation
const objectIdValidation = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

// Attachment validation schema
const attachmentSchema = Joi.object({
  type: Joi.string().valid("image", "video", "audio", "document").required(),
  url: Joi.string().uri().required(),
  filename: Joi.string().min(1).max(255).required(),
  size: Joi.number()
    .positive()
    .max(100 * 1024 * 1024)
    .required(), // Max 100MB
  mimeType: Joi.string().required(),
  thumbnailUrl: Joi.string().uri().optional(),
});

// Reply to schema
const replyToSchema = Joi.object({
  messageId: objectIdValidation.required(),
  senderId: objectIdValidation.required(),
  content: Joi.string().max(200).required(),
  messageType: Joi.string().valid("text", "media", "emoji").required(),
});

// Create message validation
export const createMessageSchema = Joi.object({
  chatId: objectIdValidation.required(),
  senderId: objectIdValidation.required(),
  content: Joi.string()
    .max(4000)
    .when("messageType", {
      is: Joi.string().valid("text", "emoji"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  messageType: Joi.string()
    .valid("text", "image", "video", "audio", "document", "emoji")
    .default("text"),
  attachments: Joi.array()
    .items(attachmentSchema)
    .default([])
    .custom((attachments, helpers) => {
      const messageType = helpers.state.ancestors[0].messageType;

      if (
        (messageType === "text" || messageType === "emoji") &&
        attachments.length > 0
      ) {
        return helpers.error("any.invalid", {
          message: "Text and emoji messages cannot have attachments",
        });
      }

      if (
        messageType !== "text" &&
        messageType !== "emoji" &&
        attachments.length === 0
      ) {
        return helpers.error("any.required", {
          message: "Media messages must have attachments",
        });
      }

      // Limit attachments per message
      if (attachments.length > 10) {
        return helpers.error("array.max", {
          message: "Maximum 10 attachments per message",
        });
      }

      return attachments;
    }),
  replyTo: replyToSchema.optional(),
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

// Get messages validation
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

// Delete message validation
export const deleteMessageSchema = Joi.object({
  messageId: objectIdValidation.required(),
  deletedBy: objectIdValidation.required(),
  deleteForEveryone: Joi.boolean().default(false),
});

// Mark as read validation
export const markAsReadSchema = Joi.object({
  messageIds: Joi.array().items(objectIdValidation).min(1).max(100).required(),
  userId: objectIdValidation.required(),
});

// Add reaction validation
export const addReactionSchema = Joi.object({
  messageId: objectIdValidation.required(),
  userId: objectIdValidation.required(),
  emoji: Joi.string().min(1).max(10).required(), // Support unicode emojis
});

// Remove reaction validation
export const removeReactionSchema = Joi.object({
  messageId: objectIdValidation.required(),
  userId: objectIdValidation.required(),
  emoji: Joi.string().min(1).max(10).required(),
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
  deletedBy: objectIdValidation.required(),
  deleteForEveryone: Joi.boolean().default(false),
});
