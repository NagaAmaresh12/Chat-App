import { z } from "zod";
import { Types } from "mongoose";

// Custom validator for MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

// Media content validation schema
const mediaContentSchema = z.object({
  url: z.string().url().optional(),
  filename: z.string().optional(),
  size: z.number().positive().optional(),
  mimeType: z.string().optional(),
  duration: z.number().positive().optional(),
  thumbnail: z.string().url().optional(),
  dimensions: z
    .object({
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
});

// Create message validation schema
export const createMessageSchema = z.object({
  body: z
    .object({
      chatId: objectIdSchema,
      messageType: z
        .enum([
          "text",
          "image",
          "video",
          "audio",
          "document",
          "location",
          "contact",
        ])
        .default("text"),
      content: z.object({
        text: z.string().min(1).max(4096).optional(),
        media: mediaContentSchema.optional(),
      }),
      mentions: z.array(objectIdSchema).optional().default([]),
    })
    .refine(
      (data) => {
        if (data.messageType === "text") {
          return data.content.text && data.content.text.length > 0;
        } else {
          return data.content.media && data.content.media.url;
        }
      },
      {
        message:
          "Text messages must have text content, media messages must have media URL",
        path: ["content"],
      }
    ),
});

// Edit message validation schema
export const editMessageSchema = z.object({
  params: z.object({
    msgID: objectIdSchema,
  }),
  body: z.object({
    content: z.object({
      text: z.string().min(1).max(4096),
    }),
  }),
});

// Reply message validation schema
export const replyMessageSchema = z.object({
  params: z.object({
    msgID: objectIdSchema,
  }),
  body: z
    .object({
      messageType: z
        .enum([
          "text",
          "image",
          "video",
          "audio",
          "document",
          "location",
          "contact",
        ])
        .default("text"),
      content: z.object({
        text: z.string().min(1).max(4096).optional(),
        media: mediaContentSchema.optional(),
      }),
      mentions: z.array(objectIdSchema).optional().default([]),
    })
    .refine(
      (data) => {
        if (data.messageType === "text") {
          return data.content.text && data.content.text.length > 0;
        } else {
          return data.content.media && data.content.media.url;
        }
      },
      {
        message:
          "Text messages must have text content, media messages must have media URL",
        path: ["content"],
      }
    ),
});

// Forward message validation schema
export const forwardMessageSchema = z.object({
  params: z.object({
    msgID: objectIdSchema,
  }),
  body: z.object({
    chatIds: z.array(objectIdSchema).min(1),
  }),
});

// Post reaction validation schema
export const postReactionSchema = z.object({
  params: z.object({
    msgID: objectIdSchema,
  }),
  body: z.object({
    emoji: z.string().min(1).max(10),
    action: z.enum(["add", "remove"]).default("add"),
  }),
});

// Get messages by chat validation schema
export const getMessagesByChatSchema = z.object({
  query: z.object({
    chatId: objectIdSchema,
    page: z.string().regex(/^\d+$/).transform(Number).default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).default("50"),
    before: objectIdSchema.optional(),
    after: objectIdSchema.optional(),
  }),
});

// Get message by ID validation schema
export const getMessageByIdSchema = z.object({
  params: z.object({
    msgID: objectIdSchema,
  }),
});

// Get message status validation schema
export const getMessageStatusSchema = z.object({
  params: z.object({
    msgID: objectIdSchema,
  }),
});

// Get message thread validation schema
export const getMessageThreadSchema = z.object({
  params: z.object({
    msgID: objectIdSchema,
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).default("20"),
  }),
});

// Delete message validation schema
export const deleteMessageSchema = z.object({
  params: z.object({
    msgID: objectIdSchema,
  }),
  body: z.object({
    deleteForEveryone: z.boolean().default(false),
  }),
});
