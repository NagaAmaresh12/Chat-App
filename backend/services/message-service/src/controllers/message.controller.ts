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
  getAllChatsByUserIDSchema,
  getMessageSchemaByChatID,
} from "../utils/joi.validate.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { verifyChatAccess } from "../utils/verifyChatAccess.js";
import { uploadBufferToCloudinary } from "../utils/uploadBufferToCloudinary.js";
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
  validated?: any; // 👈 Add this
}

let CHATS_SERVICE = process.env.CHATS_SERVICE!;
let USERS_SERVICE = process.env.USERS_SERVICE!;

// ----------------- Controller -----------------
export const createMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.headers["x-user-id"] as string;
    if (!senderId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // Validate request body
    const { error, value } = createMessageSchema.validate(req.body);
    if (error)
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });

    const {
      chatId,
      chatType,
      messageType,
      content,
      attachments = [],
      replyTo,
    } = value;

    // ----------------- Verify chat -----------------
    try {
      const chatResponse = await axios.get(
        `${process.env.CHATS_SERVICE}/${chatType}-chat/${chatId}`,
        {
          headers: { "x-user-id": senderId },
        }
      );
      if (chatResponse?.data?.status !== "success") {
        return res
          .status(404)
          .json({ success: false, message: "Chat not found or access denied" });
      }
    } catch (err: any) {
      return sendError(res, "Failed to verify chat access", 500, err);
    }

    // ----------------- Verify replyTo message -----------------
    if (replyTo) {
      const originalMessage = await Message.findById(replyTo.messageId);
      if (!originalMessage || originalMessage.isDeleted)
        return res.status(404).json({
          success: false,
          message: "Original message not found or deleted",
        });
    }

    // ----------------- Validate attachments against messageType -----------------
    if (
      (messageType === "text" || messageType === "emoji") &&
      attachments.length > 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Text/emoji messages cannot have attachments",
      });
    }

    if (
      messageType !== "text" &&
      messageType !== "emoji" &&
      attachments.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Media messages must have attachments",
      });
    }

    // ----------------- Create message -----------------
    const message = new Message({
      chatId,
      chatType,
      senderId,
      content,
      messageType,
      attachments,
      replyTo,
    });

    const savedMessage = await message.save();
    // ----------------- Update chat metadata -----------------
    try {
      await axios.patch(
        `${process.env.CHATS_SERVICE}/${chatType}-chat/edit/${chatId}`,
        {
          // WHAT YOU SEND TO CHAT SERVICE
          lastMessage: savedMessage.content,
          lastMessageType: savedMessage.messageType,
          lastMessageAt: savedMessage.createdAt,
          // lastMessageSender: savedMessage.senderId,
          // lastMessageId: savedMessage._id,
        },
        { headers: { "x-user-id": senderId } }
      );
    } catch (err) {
      console.error("⚠️ Failed to update chat metadata:", err);
    }

    return res.status(201).json({
      success: true,
      message: "Message created successfully",
      data: savedMessage,
    });
  } catch (err: any) {
    console.error("❌ Create message error:", err);
    return sendError(res, "Failed to create message", 500, err);
  }
};

export const getMessagesByChatID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);

  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

  try {
    // ✅ Validate input
    const { error, value } = getMessageSchemaByChatID.validate({
      ...req.params,
      ...req.body,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const chatType = req?.body?.chatType || "private";
    const { chatId, page, limit, before, after, search, messageType } = value;
    const userId = req?.headers["x-user-id"];

    // ✅ Sanitize pagination values - FIXED: Ensure proper number conversion
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    // ✅ Verify user access to chat
    try {
      const chatResponse = await axios.get(
        `${CHATS_SERVICE}/${chatType}-chat/${chatId}`,
        {
          headers: {
            "x-user-id": userId,
            "x-refresh-token": refreshToken,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (
        chatResponse?.data?.status !== "success" ||
        !chatResponse?.data?.data
      ) {
        return res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
        });
      }
    } catch (error) {
      return sendError(res, "Failed to verify chat access", 500, error);
    }

    // ✅ Build query
    const query: any = {
      chatId: new mongoose.Types.ObjectId(chatId),
      isDeleted: false,
    };

    // ✅ Search filter
    if (search) query.$text = { $search: search };

    // ✅ Filter by message type
    if (messageType) query.messageType = messageType;

    let messages;
    const beforeId = before?.trim() || null;
    const afterId = after?.trim() || null;

    // ✅ FIXED: Handle cursor-based pagination separately
    if (beforeId || afterId) {
      // Cursor-based pagination
      if (beforeId) {
        const beforeMessage = await Message.findById(beforeId);
        if (beforeMessage) {
          query.createdAt = {
            ...query.createdAt,
            $lt: beforeMessage.createdAt,
          };
        }
      }
      if (afterId) {
        const afterMessage = await Message.findById(afterId);
        if (afterMessage) {
          query.createdAt = { ...query.createdAt, $gt: afterMessage.createdAt };
        }
      }
      messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean();
    } else {
      // ✅ FIXED: Offset-based pagination (default)
      messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean();
    }

    // ✅ Count total for pagination metadata
    const total = await Message.countDocuments(query);

    // ✅ Fetch sender user data
    const senderIds = [
      ...new Set(messages.map((msg) => msg.senderId.toString())),
    ];
    const usersMap = new Map();

    try {
      const usersPromises = senderIds.map((id) =>
        axios.get(`${USERS_SERVICE}/people/${id}`, {
          headers: {
            "x-user-id": userId,
            "x-refresh-token": refreshToken,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
      );

      const usersResponses = await Promise.allSettled(usersPromises);

      usersResponses.forEach((result, index) => {
        if (
          result.status === "fulfilled" &&
          result.value.data.status === "success"
        ) {
          usersMap.set(senderIds[index], result.value.data.data);
        }
      });

      if (usersMap.size === 0) {
        console.warn("No users resolved successfully for chat:", chatId);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }

    // ✅ Attach user info to messages
    const messagesWithUsers = messages.map((message) => ({
      ...message,
      sender: usersMap.get(message.senderId.toString()) || null,
    }));

    // ✅ Pagination info
    const hasMore =
      beforeId || afterId
        ? messages.length === safeLimit
        : skip + messages.length < total;
    const hasPrevious = safePage > 1 && !beforeId && !afterId;

    console.log("====================================");
    console.log({
      data: {
        messages: messagesWithUsers,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasMore,
        hasPrevious,
      },
    });
    console.log("====================================");

    // ✅ Send final response
    res.json({
      success: true,
      data: {
        messages: messagesWithUsers,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasMore,
        hasPrevious,
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
    const userId = req?.headers["x-user-id"] as string;
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
    // 1️⃣ Extract tokens
    const token =
      req.cookies?.accessToken ||
      req.cookies?.refreshToken ||
      (req.headers?.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    const refreshToken =
      req.body?.refreshToken || req.headers["x-refresh-token"];

    if (!token) {
      return sendError(res, "Unauthorized: Token missing", 401);
    }

    // 2️⃣ Extract params
    const { messageId } = req.params;
    const { deleteForEveryone } = req.body;
    const userId = req.headers["x-user-id"] as string;

    console.log("====================================");
    console.log({ deleteForEveryone, userId });
    console.log("====================================");
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return sendError(res, "Invalid user ID", 400);
    }

    if (!mongoose.isValidObjectId(messageId)) {
      return sendError(res, "Invalid message ID", 400);
    }

    // 3️⃣ Find message
    const message = await Message.findById(messageId);
    console.log("====================================");
    console.log({ message });
    console.log("====================================");
    if (!message) return sendError(res, "Message not found", 404);
    if (message.isDeleted)
      return sendError(res, "Message already deleted", 400);

    // 4️⃣ Permission checks
    const isOwner = message.senderId.toString() === userId;
    let canDeleteForEveryone = isOwner;

    if (deleteForEveryone && !isOwner) {
      try {
        const chatUrl = `${CHATS_SERVICE}/${
          message.chatType
        }-chat/${message.chatId.toString()}`;
        const chatRes = await axios.get(chatUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
            "x-user-id": userId,
          },
        });
        console.log("====================================");
        console.log({ chatRes });
        console.log("====================================");
        canDeleteForEveryone = chatRes.data?.data?.role === "admin";
      } catch (err: any) {
        console.error("Chat admin check failed:", err.message);
        return sendError(res, "User is not an admin", 403);
      }
    }

    if (!isOwner && !canDeleteForEveryone) {
      return sendError(res, "You can only delete your own messages", 403);
    }

    // 5️⃣ Soft delete logic
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = new mongoose.Types.ObjectId(userId);

    if (deleteForEveryone && canDeleteForEveryone) {
      message.content = "";
      message.attachments = [];
    }

    await message.save();

    // 6️⃣ Success response
    return sendSuccess(res, null, "Message deleted successfully", 200);
  } catch (error: any) {
    console.error("❌ Delete message error:", error.message);
    return sendError(res, "Internal server error", 500, error);
  }
};

// Forward messages
export const forwardMessage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);
  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

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
    const userId = req?.headers["x-user-id"];

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
          headers: {
            "x-user-id": userId,
            "x-refresh-token": refreshToken,
            ...(token && { Authorization: `Bearer ${token}` }),
          },
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
    // Extract userId from header (already authenticated)
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate request body
    const { error, value } = markAsReadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { messageIds } = value;

    // Convert IDs to ObjectId once
    const objectIds = messageIds.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Update all unread messages for this user
    const result = await Message.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
        "readBy.userId": { $ne: userObjectId },
      },
      {
        $addToSet: {
          readBy: {
            userId: userObjectId,
            readAt: new Date(),
          },
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: result.modifiedCount
        ? `${result.modifiedCount} message(s) marked as read`
        : "No unread messages to update",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

// Add reaction to message
export const addReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ Validate input
    const { error, value } = addReactionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return sendError(
        res,
        "Body validation failed",
        400,
        error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        }))
      );
    }

    const { messageId, emoji } = value;
    const userId = req?.headers["x-user-id"] as string;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return sendError(res, "Invalid or missing user ID", 400);
    }

    // ✅ Find message (only non-deleted)
    const message = await Message.findOne({
      _id: messageId,
      isDeleted: false,
    });

    if (!message) {
      return sendError(res, "Message not found or deleted", 404);
    }

    // ✅ Check if user already reacted with this emoji
    const alreadyReacted = message.reactions.some(
      (r) =>
        r.userId.toString() === userId &&
        r.emoji.toLowerCase() === emoji.toLowerCase()
    );

    if (alreadyReacted) {
      return sendError(res, "You already reacted with this emoji", 400);
    }

    // ✅ Add reaction
    message.reactions.push({
      userId: new mongoose.Types.ObjectId(userId),
      emoji,
      reactedAt: new Date(),
    });

    await message.save();

    // ✅ Return updated reactions
    return sendSuccess(
      res,
      { reactions: message.reactions },
      "Reaction added successfully"
    );
  } catch (error) {
    console.error("❌ Add reaction error:", error);
    return sendError(res, "Internal server error", 500, error);
  }
};

// Remove reaction from message
export const removeReaction = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Validate request body
    const { error, value } = removeReactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { messageId } = value;
    const userId = req.headers["x-user-id"] as string;

    // Ensure user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Fetch the message
    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found or deleted",
      });
    }

    // Check if user has reacted
    const hasReaction = message.reactions.some(
      (reaction) => reaction.userId.toString() === userId
    );

    if (!hasReaction) {
      return res.status(400).json({
        success: false,
        message: "You haven't reacted to this message",
      });
    }

    // Remove only the user's reaction(s)
    await Message.updateOne(
      { _id: messageId },
      {
        $pull: {
          reactions: { userId: new mongoose.Types.ObjectId(userId) },
        },
      }
    );

    // Fetch updated reactions for response
    const updatedMessage = await Message.findById(messageId, { reactions: 1 });

    return res.json({
      success: true,
      message: "Your reaction(s) removed successfully",
      data: {
        reactions: updatedMessage?.reactions || [],
      },
    });
  } catch (error) {
    console.error("Remove reaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Search messages
// export const searchMessages = async (
//   req: AuthenticatedRequest,
//   res: Response
// ) => {
//   try {
//     // --- Extract and prepare auth info ---
//     const token =
//       req.cookies?.accessToken ||
//       req.cookies?.refreshToken ||
//       (req.headers.authorization?.startsWith("Bearer ")
//         ? req.headers.authorization.split(" ")[1]
//         : undefined);

//     const refreshToken =
//       req.headers["x-refresh-token"] || req.body?.refreshToken;
//     const userId = req?.headers["x-user-id"] as string;

//     const headers = {
//       "x-user-id": userId,
//       "x-refresh-token": refreshToken,
//       ...(token && { Authorization: `Bearer ${token}` }),
//     };

//     // --- Validate query params ---
//     const { error, value } = searchMessagesSchema.validate(req.query);
//     if (error) {
//       return sendError(
//         res,
//         "Body validation failed",
//         400,
//         error.details.map((d) => ({
//           field: d.path.join("."),
//           message: d.message,
//         }))
//       );
//     }

//     const {
//       chatId,
//       query = "",
//       page = 1,
//       limit = 20,
//       messageType,
//       senderId,
//       dateFrom,
//       dateTo,
//     } = value;

//     const skip = (page - 1) * limit;
//     const searchQuery: any = { isDeleted: false };

//     // --- Full text search ---
//     if (query) {
//       searchQuery.$text = { $search: query };
//     }

//     // --- Chat access check and scope filtering ---
//     if (chatId) {
//       // Verify user access to that chat
//       try {
//         const { data } = await axios.get(
//           `${CHATS_SERVICE}/api/chats/${chatId}`,
//           { headers }
//         );
//         if (!data?.success) {
//           return sendError(res, "Chat not found or access denied", 404);
//         }
//       } catch {
//         return sendError(res, "Failed to verify chat access", 500);
//       }

//       searchQuery.chatId = new mongoose.Types.ObjectId(chatId);
//     } else {
//       // Fetch accessible chats for user
//       try {
//         const { data } = await axios.get(`${CHATS_SERVICE}/api/chats`, {
//           headers,
//         });
//         const accessibleChats = data?.data || [];

//         if (!accessibleChats.length) {
//           return sendSuccess(res, {
//             messages: [],
//             pagination: {
//               page,
//               limit,
//               total: 0,
//               totalPages: 0,
//               hasMore: false,
//               hasPrevious: false,
//             },
//           });
//         }

//         searchQuery.chatId = {
//           $in: accessibleChats.map(
//             (chat: any) => new mongoose.Types.ObjectId(chat._id)
//           ),
//         };
//       } catch {
//         return sendError(res, "Failed to fetch accessible chats", 500);
//       }
//     }

//     // --- Optional filters ---
//     if (messageType) searchQuery.messageType = messageType;
//     if (senderId) searchQuery.senderId = new mongoose.Types.ObjectId(senderId);

//     if (dateFrom || dateTo) {
//       searchQuery.createdAt = {};
//       if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
//       if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
//     }

//     // --- Query messages ---
//     const [messages, total] = await Promise.all([
//       Message.find(searchQuery, { score: { $meta: "textScore" } })
//         .sort({ score: { $meta: "textScore" }, createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       Message.countDocuments(searchQuery),
//     ]);

//     // --- Fetch unique sender details in parallel ---
//     const senderIds = [...new Set(messages.map((m) => m.senderId?.toString()))];
//     const usersMap = new Map<string, any>();

//     const userRequests = senderIds.map((id) =>
//       axios.get(`${USERS_SERVICE}/people/${id}`, { headers })
//     );

//     const userResponses = await Promise.allSettled(userRequests);

//     userResponses.forEach((result, i) => {
//       if (
//         result.status === "fulfilled" &&
//         result.value.data?.status === "success"
//       ) {
//         usersMap.set(senderIds[i], result.value.data.data);
//       }
//     });

//     const enrichedMessages = messages.map((msg) => ({
//       ...msg,
//       sender: usersMap.get(msg.senderId?.toString()) || null,
//     }));

//     // --- Send response ---
//     return sendSuccess(res, {
//       messages: enrichedMessages,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//         hasMore: skip + messages.length < total,
//         hasPrevious: page > 1,
//       },
//     });
//   } catch (error) {
//     console.error("Search messages error:", error);
//     return sendError(res, "Internal server error", 500, error);
//   }
// };
// // Bulk delete messages
export const bulkDeleteMessages = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Extract tokens for cross-service auth
    const token =
      req.cookies?.accessToken ||
      req.cookies?.refreshToken ||
      (req.headers?.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    const refreshToken =
      req.headers["x-refresh-token"] || req.body?.refreshToken;

    const { error, value } = bulkDeleteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    const { messageIds, deleteForEveryone } = value;
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: missing user ID",
      });
    }

    // Fetch messages that are not deleted
    const messages = await Message.find({
      _id: {
        $in: messageIds.map((id: string) => new mongoose.Types.ObjectId(id)),
      },
      isDeleted: false,
    });

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid messages found",
      });
    }

    // Permission map to avoid redundant API calls
    const chatAdminMap = new Map<string, boolean>();
    const deletableMessages: typeof messages = [];

    for (const message of messages) {
      const isOwner = message.senderId.toString() === userId;
      let canDelete = isOwner;

      // Admin check if deleteForEveryone requested and not the sender
      if (deleteForEveryone && !isOwner) {
        const chatId = message.chatId.toString();

        // Avoid duplicate network calls
        if (!chatAdminMap.has(chatId)) {
          try {
            const chatRes = await axios.get(
              `${CHATS_SERVICE}/${message.chatType}-chat/${message?.chatId}`,
              {
                headers: {
                  "x-user-id": userId,
                  "x-refresh-token": refreshToken,
                  ...(token && { Authorization: `Bearer ${token}` }),
                },
              }
            );
            chatAdminMap.set(chatId, chatRes.data?.data?.role === "admin");
          } catch {
            chatAdminMap.set(chatId, false);
          }
        }

        canDelete = chatAdminMap.get(chatId) ?? false;
      }

      if (canDelete) deletableMessages.push(message);
    }

    if (deletableMessages.length === 0) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to delete any of the selected messages",
      });
    }

    // Build update object
    const updateData: Partial<IMessage> = {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: new mongoose.Types.ObjectId(userId),
    };

    if (deleteForEveryone) {
      updateData.content = "";
      updateData.attachments = [];
    }

    // Apply updates
    await Message.updateMany(
      { _id: { $in: deletableMessages.map((msg) => msg._id) } },
      { $set: updateData }
    );

    return res.json({
      success: true,
      message: `${deletableMessages.length} message(s) deleted successfully`,
      data: {
        deletedCount: deletableMessages.length,
        totalRequested: messageIds.length,
      },
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getMessageByMsgId = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.cookies?.refreshToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    const refreshToken =
      req?.body?.refreshToken || req?.headers["x-refresh-token"];

    if (!token) {
      return sendError(res, "Unauthorized: Token missing", 401);
    }

    const { messageId } = req.params;
    const userId = req.headers["x-user-id"] as string;
    console.log("====================================");
    console.log({ messageId });
    console.log("====================================");
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return sendError(res, "Invalid user ID", 400);
    }

    if (!mongoose.isValidObjectId(messageId)) {
      return sendError(res, "Invalid message ID", 400);
    }

    // 1️⃣ Fetch message
    const message = await Message.findById(messageId).select("-__v").exec();

    console.log("====================================");
    console.log({ message });
    console.log("====================================");

    if (!message || message.isDeleted) {
      return sendError(res, "Message not found", 404);
    }

    // 2️⃣ Prepare headers for downstream services
    const headers = {
      "x-user-id": userId,
      Authorization: `Bearer ${token}`,
      "x-refresh-token": refreshToken,
    };
    console.log("verifying the user access to chat..");

    // 3️⃣ Verify user access to chat
    let chatType = message?.chatType;
    let chatVerified = false;
    console.log("====================================");
    console.log({ chatType, chatId: message?.chatId });
    console.log("====================================");
    if (chatType) {
      // direct known type || checking the chatType that exists in messageSchema
      chatVerified = await verifyChatAccess(
        chatType,
        message.chatId.toString(),
        headers
      );
    } else {
      // try both types if unknown
      console.warn(
        "⚠️ chatType missing in message. Trying both private and group chat endpoints..."
      );
      //checking for private
      chatVerified =
        (await verifyChatAccess(
          "private",
          message.chatId.toString(),
          headers
        )) ||
        //checking for group
        (await verifyChatAccess("group", message.chatId.toString(), headers));
    }

    if (!chatVerified) {
      return sendError(res, "Access denied to chat", 403);
    }

    // 4️⃣ Fetch sender info (non-blocking)
    try {
      const userRes = await axios.get(
        `${USERS_SERVICE}/people/${message.senderId}`,
        { headers }
      );
      if (userRes.data?.status === "success") {
        (message as any)._doc.sender = userRes.data.data;
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch sender info:", err);
    }

    // 5️⃣ Return success
    return sendSuccess(
      res,
      message,
      "Successfully retrieved message data",
      200
    );
  } catch (error: any) {
    console.error("❌ Get message by ID error:", error.message);
    return sendError(res, "Failed to get message by ID", 500, error);
  }
};
