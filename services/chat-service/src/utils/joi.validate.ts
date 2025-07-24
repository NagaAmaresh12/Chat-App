import Joi from "joi";
// schemas/singleChat.schema.ts

export const singleChatSchema = Joi.object({
  // senderId: Joi.string().required(), // or Joi.string().hex().length(24) for ObjectId
  receiverId: Joi.string().required(), // same here
  initialMessage: Joi.string().trim().min(1).max(1000).required(), // example field
});

export const userIDParamsSchema = Joi.object({
  userID: Joi.string().length(24).required(),
});

export const chatIDParamsSchema = Joi.object({
  chatID: Joi.string().length(24).required(),
});

export const editChatSchema = Joi.object({
  chatName: Joi.string().min(1).max(255).optional(),
  isArchived: Joi.boolean().optional(),
});
