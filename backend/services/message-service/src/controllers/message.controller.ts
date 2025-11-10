import { Request, Response } from "express";
import mongoose from "mongoose";
import axios from "axios";
import { Message, IMessage } from "../models/message.model.js";
import {
  createMessageSchema,
  getMessagesSchema,
  deleteMessageSchema,
  updateMessageSchema,
  forwardMessageSchema,
  markAsReadSchema,
  addReactionSchema,
  bulkDeleteSchema,
  searchMessagesSchema,
  removeReactionSchema,
} from "../utils/joi.validate.js";
import { sendError, sendSuccess } from "../utils/response.js";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

let CHATS_SERVICE = process.env.CHATS_SERVICE!;
let USERS_SERVICE = process.env.USERS_SERVICE!;


// Create a new message
export const createMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("🔹 Creating new message...");

    // Use the authenticated user ID as senderId
    const senderId = req.headers["x-user-id"] as string;
    if (!senderId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token =
      req.headers["authorization"]?.split(" ")[1] ||
      req.cookies?.accessToken ||
      req.cookies?.refreshToken;
    console.log('====================================');
    console.log({token});
    console.log('====================================');
    // Validate request body
    const { error, value } = createMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    const { chatId, content, messageType, attachments, replyTo, chatType } = value;

    console.log("🔹 Incoming message data:", {
      chatId,
      senderId,
      content,
      messageType,
      attachments,
      replyTo,
      chatType,
    });

    // ------------------------- Verify chat -------------------------
    try {
      const chatResponse = await axios.get(
        `${CHATS_SERVICE}/${chatType}-chat/${chatId}`,
        {
          headers: { "x-user-id": senderId, Authorization: `Bearer ${token}` },
        }
      );

      if (chatResponse?.data?.status !== "success" || !chatResponse.data.data) {
        return res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
        });
      }
    } catch (err: any) {
      return sendError(res, "Failed to verify chat access", 500, err);
    }

    // ------------------------- Verify user -------------------------
    let userData;
    try {
      const userResponse = await axios.get(`${USERS_SERVICE}/people/${senderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse?.data?.status !== "success" || !userResponse?.data?.data) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      userData = userResponse.data.data;
      console.log("🔹 Verified user:", userData);
    } catch (err: any) {
      return sendError(res, "Failed to verify user", 500, err);
    }

    // ------------------------- Verify replyTo message -------------------------
    if (replyTo) {
      const originalMessage = await Message.findById(replyTo.messageId);
      if (!originalMessage || originalMessage.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Original message not found or deleted",
        });
      }
    }

    // ------------------------- Create message -------------------------
    const message = new Message({
      chatId,
      senderId,
      content,
      messageType,
      attachments,
      replyTo,
    });

    const savedMessage = await message.save();
    console.log("🔹 Message saved:", savedMessage._id);

    const populatedMessage = {
      ...savedMessage.toObject(),
      sender: userData,
    };

    res.status(201).json({
      success: true,
      message: "Message created successfully",
      data: populatedMessage,
    });
  } catch (err: any) {
    return sendError(res, "Failed to create message", 500, err);
  }
};


// Get messages for a chat with pagination
export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = getMessagesSchema.validate({
      ...req.params,
      ...req.query,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { chatId, page, limit, before, after, search, messageType } = value;
    const userId = req.user?.id;

    // Verify user has access to chat
    try {
      const chatResponse = await axios.get(
        `${CHATS_SERVICE}/api/chats/${chatId}`,
        {
          headers: { "user-id": userId },
        }
      );

      if (chatResponse?.data?.status !== "success" || !chatResponse?.data?.data) {
        return res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
        });
      }
    } catch (error) {
      sendError(res,"Failed to verify chat access",500,error)
    }

    // Build query
    const query: any = {
      chatId: new mongoose.Types.ObjectId(chatId),
      isDeleted: false,
    };

    // Add cursor-based pagination
    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    if (after) {
      const afterMessage = await Message.findById(after);
      if (afterMessage) {
        query.createdAt = { $gt: afterMessage.createdAt };
      }
    }

    // Add search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by message type
    if (messageType) {
      query.messageType = messageType;
    }

    const skip = (page - 1) * limit;

    // Get messages with pagination
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Message.countDocuments(query);

    // Get user data for all unique sender IDs
    const senderIds = [
      ...new Set(messages.map((msg) => msg.senderId.toString())),
    ];
    const usersMap = new Map();

    try {
      const usersPromises = senderIds.map((id) =>
        axios.get(`${USERS_SERVICE}/people/${id}`)
      );
      const usersResponses = await Promise.allSettled(usersPromises);

      usersResponses.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.data.success) {
          usersMap.set(senderIds[index], result.value.data.data);
        }
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    }

    // Attach user data to messages
    const messagesWithUsers = messages.map((message) => ({
      ...message,
      sender: usersMap.get(message.senderId.toString()) || null,
    }));

    // Calculate pagination info
    const hasMore = skip + messages.length < total;
    const hasPrevious = page > 1;

    res.json({
      success: true,
      data: {
        messages: messagesWithUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore,
          hasPrevious,
        },
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update/Edit a message
export const updateMessage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (!userObjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const { error, value } = updateMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { content } = value;

    // Find message and verify ownership
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit deleted message",
      });
    }

    // Only text and emoji messages can be edited
    if (!["text", "emoji"].includes(message.messageType)) {
      return res.status(400).json({
        success: false,
        message: "Only text and emoji messages can be edited",
      });
    }

    // Update message
    message.content = content;
    message.editedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: "Message updated successfully",
      data: message,
    });
  } catch (error) {
    console.error("Update message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a message
export const deleteMessage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (!userObjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Message already deleted",
      });
    }

    // Check permissions
    const isOwner = message.senderId.toString() === userId;
    let canDeleteForEveryone = isOwner;

    // Check if user is admin of the chat (if deleteForEveryone is true)
    if (deleteForEveryone && !isOwner) {
      try {
        const chatResponse = await axios.get(
          `${CHATS_SERVICE}/api/chats/${message.chatId}/members/${userId}`
        );
        canDeleteForEveryone = chatResponse.data.data?.role === "admin";
      } catch (error) {
        canDeleteForEveryone = false;
      }
    }

    if (!isOwner && !canDeleteForEveryone) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    // Delete message
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = new mongoose.Types.ObjectId(userId);

    if (deleteForEveryone && canDeleteForEveryone) {
      // Delete for everyone - clear content but keep metadata
      message.content = "";
      message.attachments = [];
    }

    await message.save();

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Forward messages
export const forwardMessage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { error, value } = forwardMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { originalMessageId, targetChatIds, senderId } = value;
    const userId = req.user?.id;

    if (senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Invalid sender",
      });
    }

    // Find original message
    const originalMessage = await Message.findById(originalMessageId);
    if (!originalMessage || originalMessage.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Original message not found or deleted",
      });
    }

    // Verify access to all target chats
    const chatVerifications = await Promise.allSettled(
      targetChatIds.map((chatId: string) =>
        axios.get(`${CHATS_SERVICE}/api/chats/${chatId}`, {
          headers: { "user-id": userId },
        })
      )
    );

    const validChatIds = targetChatIds.filter(
      (_: any, index: number) =>
        chatVerifications[index]?.status === "fulfilled" &&
        (chatVerifications[index] as any).value.data.success
    );

    if (validChatIds.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No valid target chats found",
      });
    }

    // Create forwarded messages
    const forwardedMessages = await Promise.all(
      validChatIds.map(async (chatId: string) => {
        const forwardedMessage = new Message({
          chatId,
          senderId,
          content: originalMessage.content,
          messageType: originalMessage.messageType,
          attachments: originalMessage.attachments,
          forwardedFrom: {
            originalMessageId: originalMessage._id,
            originalSenderId: originalMessage.senderId,
            forwardedAt: new Date(),
          },
        });

        return await forwardedMessage.save();
      })
    );

    res.json({
      success: true,
      message: "Messages forwarded successfully",
      data: {
        forwardedCount: forwardedMessages.length,
        messages: forwardedMessages,
      },
    });
  } catch (error) {
    console.error("Forward message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Mark messages as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = markAsReadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { messageIds, userId } = value;

    if (userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "Invalid user",
      });
    }

    // Update messages - add to readBy if not already read
    await Message.updateMany(
      {
        _id: {
          $in: messageIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        },
        "readBy.userId": { $ne: new mongoose.Types.ObjectId(userId) },
        isDeleted: false,
      },
      {
        $addToSet: {
          readBy: {
            userId: new mongoose.Types.ObjectId(userId),
            readAt: new Date(),
          },
        },
      }
    );

    res.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Add reaction to message
export const addReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = addReactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { messageId, userId, emoji } = value;

    if (userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "Invalid user",
      });
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found or deleted",
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      (reaction) =>
        reaction.userId.toString() === userId && reaction.emoji === emoji
    );

    if (existingReaction) {
      return res.status(400).json({
        success: false,
        message: "You have already reacted with this emoji",
      });
    }

    // Add reaction
    message.reactions.push({
      userId: new mongoose.Types.ObjectId(userId),
      emoji,
      reactedAt: new Date(),
    });

    await message.save();

    res.json({
      success: true,
      message: "Reaction added successfully",
      data: {
        reactions: message.reactions,
      },
    });
  } catch (error) {
    console.error("Add reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Remove reaction from message
export const removeReaction = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { error, value } = removeReactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { messageId, userId, emoji } = value;

    if (userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "Invalid user",
      });
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found or deleted",
      });
    }

    // Remove reaction
    message.reactions = message.reactions.filter(
      (reaction) =>
        !(reaction.userId.toString() === userId && reaction.emoji === emoji)
    );

    await message.save();

    res.json({
      success: true,
      message: "Reaction removed successfully",
      data: {
        reactions: message.reactions,
      },
    });
  } catch (error) {
    console.error("Remove reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Search messages
export const searchMessages = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const token =
      req.headers["authorization"] ||
      req.cookies?.accessToken ||
      req.cookies?.refreshToken;
  try {
    const { error, value } = searchMessagesSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const {
      chatId,
      query,
      page,
      limit,
      messageType,
      senderId,
      dateFrom,
      dateTo,
    } = value;
    const userId = req.user?.id;

    // Build search query
    const searchQuery: any = {
      $text: { $search: query },
      isDeleted: false,
    };

    if (chatId) {
      // Verify access to specific chat
      try {
        const chatResponse = await axios.get(
          `${CHATS_SERVICE}/api/chats/${chatId}`,
          {
            headers: { "x-user-id": userId },
          }
        );

        if (!chatResponse.data.success) {
          return res.status(404).json({
            success: false,
            message: "Chat not found or access denied",
          });
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to verify chat access",
        });
      }

      searchQuery.chatId = new mongoose.Types.ObjectId(chatId);
    } else {
      // Search in all accessible chats
      try {
        const chatsResponse = await axios.get(
          `${CHATS_SERVICE}/api/chats`,
          {
            headers: { "user-id": userId },
          }
        );

        if (chatsResponse.data.success && chatsResponse.data.data.length > 0) {
          const accessibleChatIds = chatsResponse.data.data.map(
            (chat: any) => new mongoose.Types.ObjectId(chat._id)
          );
          searchQuery.chatId = { $in: accessibleChatIds };
        } else {
          return res.json({
            success: true,
            data: {
              messages: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
                hasMore: false,
                hasPrevious: false,
              },
            },
          });
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to get accessible chats",
        });
      }
    }

    // Add additional filters
    if (messageType) {
      searchQuery.messageType = messageType;
    }

    if (senderId) {
      searchQuery.senderId = new mongoose.Types.ObjectId(senderId);
    }

    if (dateFrom || dateTo) {
      searchQuery.createdAt = {};
      if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    // Execute search
    const messages = await Message.find(searchQuery, {
      score: { $meta: "textScore" },
    })
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments(searchQuery);

    // Get user data for messages
    const senderIds = [
      ...new Set(messages.map((msg) => msg.senderId.toString())),
    ];
    const usersMap = new Map();

    try {
      const usersPromises = senderIds.map((id) =>
        axios.get(`${USERS_SERVICE}/people/${id}`,{
          headers: { "user-id": userId ,Authorization:token},
        })
      );
      const usersResponses = await Promise.allSettled(usersPromises);

      usersResponses.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.data.success) {
          usersMap.set(senderIds[index], result.value.data.data);
        }
      });
    } catch (error) {
      console.error("Error fetching users for search:", error);
    }

    const messagesWithUsers = messages.map((message) => ({
      ...message,
      sender: usersMap.get(message.senderId.toString()) || null,
    }));

    res.json({
      success: true,
      data: {
        messages: messagesWithUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + messages.length < total,
          hasPrevious: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Search messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Bulk delete messages
export const bulkDeleteMessages = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const token =
      req.headers["authorization"] ||
      req.cookies?.accessToken ||
      req.cookies?.refreshToken;
  try {
    const { error, value } = bulkDeleteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { messageIds, deletedBy, deleteForEveryone } = value;
    const userId = req.user?.id;

    if (deletedBy !== userId) {
      return res.status(403).json({
        success: false,
        message: "Invalid user",
      });
    }

    // Find messages and check permissions
    const messages = await Message.find({
      _id: {
        $in: messageIds.map((id: any) => new mongoose.Types.ObjectId(id)),
      },
      isDeleted: false,
    });

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid messages found",
      });
    }

    // Check permissions for each message
    const deletableMessages = [];
    const chatAdminMap = new Map();

    for (const message of messages) {
      const isOwner = message.senderId.toString() === userId;
      let canDelete = isOwner;

      // Check admin permissions if deleteForEveryone
      if (deleteForEveryone && !isOwner) {
        const chatId = message.chatId.toString();

        if (!chatAdminMap.has(chatId)) {
          try {
            const chatResponse = await axios.get(
              `${CHATS_SERVICE}/api/chats/${chatId}/members/${userId}`,{
          headers: { "user-id": userId ,Authorization:token},
        }
            );
            const isAdmin = chatResponse.data.data?.role === "admin";
            chatAdminMap.set(chatId, isAdmin);
          } catch (error) {
            chatAdminMap.set(chatId, false);
          }
        }

        canDelete = chatAdminMap.get(chatId);
      }

      if (canDelete) {
        deletableMessages.push(message);
      }
    }

    if (deletableMessages.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No permission to delete any of the selected messages",
      });
    }

    // Update messages
    const updateData: any = {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: new mongoose.Types.ObjectId(userId),
    };

    if (deleteForEveryone) {
      updateData.content = "";
      updateData.attachments = [];
    }

    await Message.updateMany(
      { _id: { $in: deletableMessages.map((msg) => msg._id) } },
      updateData
    );

    res.json({
      success: true,
      message: `${deletableMessages.length} messages deleted successfully`,
      data: {
        deletedCount: deletableMessages.length,
        totalRequested: messageIds.length,
      },
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get message by ID
export const getMessageById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    let token = req?.headers.authorization || req?.cookies?.accessToken ||req?.cookies?.refreshToken
    const { messageId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (!userObjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const message = await Message.findById(messageId).lean();
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify access to chat
    try {
      const chatResponse = await axios.get(
        `${CHATS_SERVICE}/api/chats/${message.chatId}`,
        {
          headers: { "user-id": userId ,Authorization:token},
        }
      );

      if (!chatResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify chat access",
      });
    }

    // Get sender data
    try {
      const userResponse = await axios.get(
        `${USERS_SERVICE}/people/${message.senderId}`,
        {
          headers: {
      Authorization: token || "", // send the token if needed
      // "x-user-id": senderId // optional if your service requires it
    }
        }
      );
      if (userResponse.data?.status =='success') {
        (message as any).sender = userResponse.data.data;
      }
    } catch (error) {
      console.error("Error fetching sender data:", error);
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Get message by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
