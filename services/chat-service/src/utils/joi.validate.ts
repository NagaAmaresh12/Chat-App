// privateChatSchema
import Joi, { string } from "joi";
export const privateChatSchema = Joi.object({
  participantID: Joi.string().required(), // User you're chatting with
});

// chatIDParamsSchema
export const chatIDParamsSchema = Joi.object({
  chatID: Joi.string().hex().length(24).required(),
});

// editChatSchema
export const editChatSchema = Joi.object({
  isArchived: Joi.boolean(),
  isMuted: Joi.boolean(),
  lastSeen: Joi.date(),
});
// deleteGroupSchema
export const deleteGroupSchema = Joi.object({
  isArchived: Joi.boolean(),
  isMuted: Joi.boolean(),
  lastSeen: Joi.date(),
});

// groupChatSchema
export const groupChatSchema = Joi.object({
  name: Joi.string().min(3).required(),
  members: Joi.array().items(Joi.string().hex().length(24)).min(2).required(),
  description: Joi.string().allow(""),
});

// editGroupSchema
export const editGroupSchema = Joi.object({
  name: Joi.string().min(3),
  description: Joi.string(),
});

// addMemberSchema
// export const addMemberSchema = Joi.object({
//   userID: Joi.string().hex().length(24).required(),
// });

export const addMemberSchema = Joi.object({
  userIDs: Joi.array()
    .items(Joi.string().hex().length(24).required())
    .min(1)
    .required(),
});
// removeMemberSchema
export const removeMemberSchema = Joi.object({
  userIDs: Joi.array()
    .items(Joi.string().hex().length(24).required())
    .min(1)
    .required(),
});
