import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

// Generic validation middleware factory
export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Merge validated data back to request
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.params) req.params = validatedData.params;
      if (validatedData.query) req.query = validatedData.query;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error during validation",
      });
    }
  };
};

// File upload validation middleware for media messages
export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const messageType = req.body.messageType;

  if (
    messageType &&
    messageType !== "text" &&
    !req.file &&
    !req.body.content?.media?.url
  ) {
    return res.status(400).json({
      success: false,
      message: "Media file is required for non-text messages",
    });
  }

  // Validate file types based on message type
  if (req.file) {
    const allowedTypes: Record<string, string[]> = {
      image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      video: ["video/mp4", "video/avi", "video/mov", "video/wmv"],
      audio: ["audio/mp3", "audio/wav", "audio/ogg", "audio/m4a"],
      document: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };

    if (
      messageType &&
      allowedTypes[messageType] &&
      !allowedTypes[messageType].includes(req.file.mimetype)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type for ${messageType} message`,
      });
    }

    // File size validation (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 10MB",
      });
    }
  }

  next();
};

// Chat membership validation middleware
export const validateChatMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { Chat } = await import("../models/Chat"); // Assuming you have a Chat model
    const userId = (req as any).user.id;
    const chatId = req.body.chatId || req.query.chatId;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID is required",
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if user is a member of the chat
    const isMember = chat.members.some(
      (member: any) => member.toString() === userId
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating chat membership",
    });
  }
};

// Message ownership validation middleware
export const validateMessageOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { Message } = await import("../models/Message");
    const userId = (req as any).user.id;
    const messageId = req.params.msgID;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is the sender of the message
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only modify your own messages",
      });
    }

    // Check if message is already deleted
    if (message.deletedAt) {
      return res.status(400).json({
        success: false,
        message: "Message has already been deleted",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating message ownership",
    });
  }
};

// Rate limiting middleware for message creation
export const rateLimitMessages = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Implement rate limiting logic here
  // This is a simple in-memory rate limiter
  const userId = (req as any).user.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxMessages = 100; // 100 messages per minute

  if (!global.messageRateLimit) {
    global.messageRateLimit = new Map();
  }

  const userLimit = global.messageRateLimit.get(userId) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + windowMs;
  }

  if (userLimit.count >= maxMessages) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later.",
    });
  }

  userLimit.count++;
  global.messageRateLimit.set(userId, userLimit);

  next();
};
