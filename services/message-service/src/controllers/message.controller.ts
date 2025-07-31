import { Request, Response } from "express";
import { Types } from "mongoose";
import axios from "axios";
import { Message, IMessage } from "../models/message.model.js";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    email: string;
  };
}

// Service URLs from environment variables
const CHAT_SERVICE = process.env.CHAT_SERVICE || "http://localhost:3001";
const USER_SERVICE = process.env.USER_SERVICE || "http://localhost:3000";

// Utility function to get chat information from chat service
const getChatById = async (
  chatId: string,
  token: string,
  chatType: string = "private"
) => {
  try {
    const response = await axios.get(
      `${CHAT_SERVICE}/api/chats/${chatType}/${chatId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching chat:", error);
    throw new Error("Chat not found or service unavailable");
  }
};

// Utility function to get user information from user service
const getUserById = async (userId: string, token: string) => {
  try {
    const response = await axios.get(`${USER_SERVICE}/people/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("User not found or service unavailable");
  }
};

// Utility function to get multiple users
const getUsersByIds = async (userIds: string[], token: string) => {
  try {
    const response = await axios.post(
      `${USER_SERVICE}/people/batch`,
      { userIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Create a new message
export const createNewMessage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { chatId, messageType, content, mentions, chatType } = req.body;
    const senderId = req.user.id;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    // Get chat information and verify membership
    const chatResponse = await getChatById(chatId, token, chatType);
    const chat = chatResponse.data || chatResponse;
    console.log({
      chat,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Verify user is a member of the chat
    const isMember = chat.members?.some(
      (member: any) =>
        (typeof member === "string" ? member : member._id || member.id) ===
        senderId
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    // Create delivery status for all chat members except sender
    const deliveryStatus =
      chat.members
        ?.filter((member: any) => {
          const memberId =
            typeof member === "string" ? member : member._id || member.id;
          return memberId !== senderId;
        })
        .map((member: any) => ({
          user: typeof member === "string" ? member : member._id || member.id,
          status: "sent",
          timestamp: new Date(),
        })) || [];

    const newMessage = new Message({
      chatId,
      senderId,
      messageType,
      content,
      mentions: mentions || [],
      deliveryStatus,
    });

    const savedMessage = await newMessage.save();

    // Get sender information
    const senderInfo = await getUserById(senderId, token);

    // Get mentioned users information if any
    let mentionedUsers = [];
    if (mentions && mentions.length > 0) {
      mentionedUsers = await getUsersByIds(mentions, token);
    }

    // Update chat's last message via chat service
    try {
      await axios.patch(
        `${CHAT_SERVICE}/${chatType}/${chatId}/last-message`,
        {
          lastMessage: savedMessage._id,
          lastActivity: new Date(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error updating chat last message:", error);
    }

    const responseMessage = {
      ...savedMessage.toJSON(),
      sender: senderInfo.data || senderInfo,
      mentionedUsers: mentionedUsers.data || mentionedUsers,
    };

    res.status(201).json({
      success: true,
      message: "Message created successfully",
      data: responseMessage,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create message",
    });
  }
};

// Get message by ID
export const getMessageBymsgID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    const message = await Message.findById(msgID);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if message is deleted for this user
    if (message.isDeletedForUser(new Types.ObjectId(userId))) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Get sender information
    const senderInfo = await getUserById(message.senderId.toString(), token);

    // Get mentioned users information if any
    let mentionedUsers = [];
    if (message.mentions && message.mentions.length > 0) {
      const mentionIds = message.mentions.map((id) => id.toString());
      mentionedUsers = await getUsersByIds(mentionIds, token);
    }

    // Get reply-to message info if exists
    let replyToMessage = null;
    if (message.replyTo) {
      replyToMessage = await Message.findById(message.replyTo);
      if (replyToMessage) {
        const replyToSender = await getUserById(
          replyToMessage.senderId.toString(),
          token
        );
        replyToMessage = {
          ...replyToMessage.toJSON(),
          sender: replyToSender.data || replyToSender,
        };
      }
    }

    // Get forwarded from original sender info if exists
    let originalSender = null;
    if (message.forwardedFrom?.originalSender) {
      originalSender = await getUserById(
        message.forwardedFrom.originalSender.toString(),
        token
      );
    }

    const responseMessage = {
      ...message.toJSON(),
      sender: senderInfo.data || senderInfo,
      mentionedUsers: mentionedUsers.data || mentionedUsers,
      replyTo: replyToMessage,
      forwardedFrom: message.forwardedFrom
        ? {
            ...message.forwardedFrom,
            originalSender: originalSender?.data || originalSender,
          }
        : undefined,
    };

    res.json({
      success: true,
      data: responseMessage,
    });
  } catch (error) {
    console.error("Error fetching message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message",
    });
  }
};

// Get messages by chat ID with pagination
export const getMessagesByChatID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { chatId, page = 1, limit = 50, before, after } = req.query;
    const userId = req.user.id;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    const skip = (Number(page) - 1) * Number(limit);

    // Build query
    const query: any = {
      chatId,
      deletedFor: { $ne: new Types.ObjectId(userId) },
    };

    if (before) {
      query._id = { $lt: new Types.ObjectId(before as string) };
    }
    if (after) {
      query._id = { $gt: new Types.ObjectId(after as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalMessages = await Message.countDocuments({
      chatId,
      deletedFor: { $ne: new Types.ObjectId(userId) },
    });

    // Get all unique user IDs from messages
    const userIds = new Set<string>();
    messages.forEach((message) => {
      userIds.add(message.senderId.toString());
      if (message.mentions) {
        message.mentions.forEach((mention) => userIds.add(mention.toString()));
      }
      if (message.forwardedFrom?.originalSender) {
        userIds.add(message.forwardedFrom.originalSender.toString());
      }
    });

    // Get all users info in batch
    const users = await getUsersByIds(Array.from(userIds), token);
    const usersMap = new Map();
    (users.data || users || []).forEach((user: any) => {
      usersMap.set(user._id || user.id, user);
    });

    // Process messages with user info
    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = usersMap.get(message.senderId.toString());
        const mentionedUsers =
          message.mentions
            ?.map((id) => usersMap.get(id.toString()))
            .filter(Boolean) || [];

        let replyTo = null;
        if (message.replyTo) {
          replyTo = await Message.findById(message.replyTo);
          if (replyTo) {
            const replyToSender = usersMap.get(replyTo.senderId.toString());
            replyTo = {
              ...replyTo.toJSON(),
              sender: replyToSender,
            };
          }
        }

        return {
          ...message.toJSON(),
          sender,
          mentionedUsers,
          replyTo,
          forwardedFrom: message.forwardedFrom
            ? {
                ...message.forwardedFrom,
                originalSender: usersMap.get(
                  message.forwardedFrom.originalSender?.toString()
                ),
              }
            : undefined,
        };
      })
    );

    res.json({
      success: true,
      data: {
        messages: processedMessages.reverse(), // Reverse to show oldest first
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalMessages,
          pages: Math.ceil(totalMessages / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

// Edit message by ID
export const editMessageByMsgID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const { content } = req.body;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    const message = await Message.findById(msgID);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if message can be edited (only text messages within 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: "Message can only be edited within 15 minutes of sending",
      });
    }

    if (message.messageType !== "text") {
      return res.status(400).json({
        success: false,
        message: "Only text messages can be edited",
      });
    }

    message.content.text = content.text;
    message.editedAt = new Date();

    await message.save();

    // Get sender information
    const senderInfo = await getUserById(message.senderId.toString(), token);

    const responseMessage = {
      ...message.toJSON(),
      sender: senderInfo.data || senderInfo,
    };

    res.json({
      success: true,
      message: "Message updated successfully",
      data: responseMessage,
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to edit message",
    });
  }
};

// Delete message by ID
export const deleteMessageByMsgID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const { deleteForEveryone = false } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(msgID);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (deleteForEveryone) {
      // Check if user can delete for everyone (within 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (message.createdAt < oneHourAgo) {
        return res.status(400).json({
          success: false,
          message:
            "Message can only be deleted for everyone within 1 hour of sending",
        });
      }

      message.deletedAt = new Date();
      message.content = { text: "This message was deleted" };
    } else {
      // Soft delete for this user only
      await message.softDelete(new Types.ObjectId(userId));
    }

    await message.save();

    res.json({
      success: true,
      message: deleteForEveryone
        ? "Message deleted for everyone"
        : "Message deleted for you",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};

// Reply to a message
export const replyMsgByMessageID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const { messageType, content, mentions, chatType } = req.body;
    const senderId = req.user.id;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    // Check if original message exists
    const originalMessage = await Message.findById(msgID);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: "Original message not found",
      });
    }

    // Get chat information and verify membership
    const chatResponse = await getChatById(
      originalMessage.chatId.toString(),
      token,
      chatType
    );
    const chat = chatResponse.data || chatResponse;

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Create delivery status for all chat members except sender
    const deliveryStatus =
      chat.members
        ?.filter((member: any) => {
          const memberId =
            typeof member === "string" ? member : member._id || member.id;
          return memberId !== senderId;
        })
        .map((member: any) => ({
          user: typeof member === "string" ? member : member._id || member.id,
          status: "sent",
          timestamp: new Date(),
        })) || [];

    const replyMessage = new Message({
      chatId: originalMessage.chatId,
      senderId,
      messageType,
      content,
      mentions: mentions || [],
      replyTo: msgID,
      deliveryStatus,
    });

    const savedMessage = await replyMessage.save();

    // Get sender information
    const senderInfo = await getUserById(senderId, token);

    // Get mentioned users information if any
    let mentionedUsers = [];
    if (mentions && mentions.length > 0) {
      mentionedUsers = await getUsersByIds(mentions, token);
    }

    // Get original message sender info
    const originalSenderInfo = await getUserById(
      originalMessage.senderId.toString(),
      token
    );

    // Update chat's last message
    try {
      await axios.patch(
        `${CHAT_SERVICE}/api/chats/${originalMessage.chatId}/last-message`,
        {
          lastMessage: savedMessage._id,
          lastActivity: new Date(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error updating chat last message:", error);
    }

    const responseMessage = {
      ...savedMessage.toJSON(),
      sender: senderInfo.data || senderInfo,
      mentionedUsers: mentionedUsers.data || mentionedUsers,
      replyTo: {
        ...originalMessage.toJSON(),
        sender: originalSenderInfo.data || originalSenderInfo,
      },
    };

    res.status(201).json({
      success: true,
      message: "Reply sent successfully",
      data: responseMessage,
    });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send reply",
    });
  }
};

// Forward message to multiple chats
export const forwardMsgByMessageID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const { chatIds, chatType } = req.body;
    const senderId = req.user.id;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    const originalMessage = await Message.findById(msgID);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: "Original message not found",
      });
    }

    // Check if user has access to original message
    if (originalMessage.isDeletedForUser(new Types.ObjectId(senderId))) {
      return res.status(404).json({
        success: false,
        message: "Original message not found",
      });
    }

    const forwardedMessages = [];

    for (const chatId of chatIds) {
      try {
        // Verify user is member of target chat
        const chatResponse = await getChatById(chatId, token, chatType);
        const chat = chatResponse.data || chatResponse;

        if (!chat) continue;

        const isMember = chat.members?.some((member: any) => {
          const memberId =
            typeof member === "string" ? member : member._id || member.id;
          return memberId === senderId;
        });

        if (!isMember) continue;

        // Create delivery status
        const deliveryStatus =
          chat.members
            ?.filter((member: any) => {
              const memberId =
                typeof member === "string" ? member : member._id || member.id;
              return memberId !== senderId;
            })
            .map((member: any) => ({
              user:
                typeof member === "string" ? member : member._id || member.id,
              status: "sent",
              timestamp: new Date(),
            })) || [];

        // Create forwarded message
        const forwardedMessage = new Message({
          chatId,
          senderId,
          messageType: originalMessage.messageType,
          content: originalMessage.content,
          forwardedFrom: {
            originalMessageId: originalMessage._id,
            originalSender: originalMessage.senderId,
            forwardedCount:
              (originalMessage.forwardedFrom?.forwardedCount || 0) + 1,
          },
          deliveryStatus,
        });

        const savedMessage = await forwardedMessage.save();

        // Update chat's last message
        try {
          await axios.patch(
            `${CHAT_SERVICE}/api/chats/${chatId}/last-message`,
            {
              lastMessage: savedMessage._id,
              lastActivity: new Date(),
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error("Error updating chat last message:", error);
        }

        forwardedMessages.push(savedMessage);
      } catch (error) {
        console.error(`Error forwarding to chat ${chatId}:`, error);
        continue;
      }
    }

    // Get sender and original sender info
    const senderInfo = await getUserById(senderId, token);
    const originalSenderInfo = await getUserById(
      originalMessage.senderId.toString(),
      token
    );

    const processedMessages = forwardedMessages.map((message) => ({
      ...message.toJSON(),
      sender: senderInfo.data || senderInfo,
      forwardedFrom: {
        ...message.forwardedFrom,
        originalSender: originalSenderInfo.data || originalSenderInfo,
      },
    }));

    res.json({
      success: true,
      message: `Message forwarded to ${forwardedMessages.length} chat(s)`,
      data: processedMessages,
    });
  } catch (error) {
    console.error("Error forwarding message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to forward message",
    });
  }
};

// Add or remove reaction to/from message
export const postReactionsBymsgID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const { emoji, action = "add" } = req.body;
    const userId = req.user.id;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    const message = await Message.findById(msgID);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if message is deleted for this user
    if (message.isDeletedForUser(new Types.ObjectId(userId))) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    let updatedMessage;
    if (action === "add") {
      updatedMessage = await message.addReaction(
        new Types.ObjectId(userId),
        emoji
      );
    } else {
      updatedMessage = await message.removeReaction(new Types.ObjectId(userId));
    }

    // Get user info for reactions
    const reactionUserIds = updatedMessage.reactions.map((r: any) =>
      r.user.toString()
    );
    const reactionUsers = await getUsersByIds(reactionUserIds, token);
    const usersMap = new Map();
    (reactionUsers.data || reactionUsers || []).forEach((user: any) => {
      usersMap.set(user._id || user.id, user);
    });

    const processedReactions = updatedMessage.reactions.map(
      (reaction: any) => ({
        ...reaction.toJSON(),
        user: usersMap.get(reaction.user.toString()),
      })
    );

    res.json({
      success: true,
      message:
        action === "add"
          ? "Reaction added successfully"
          : "Reaction removed successfully",
      data: {
        messageId: updatedMessage._id,
        reactions: processedReactions,
      },
    });
  } catch (error) {
    console.error("Error managing reaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to manage reaction",
    });
  }
};

// Get message delivery status
export const getMsgStatusByMsgID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    const message = await Message.findById(msgID).select(
      "deliveryStatus senderId"
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only sender can view delivery status
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view status of your own messages",
      });
    }

    // Get user info for delivery status
    const statusUserIds = message.deliveryStatus.map((s: any) =>
      s.user.toString()
    );
    const statusUsers = await getUsersByIds(statusUserIds, token);
    const usersMap = new Map();
    (statusUsers.data || statusUsers || []).forEach((user: any) => {
      usersMap.set(user._id || user.id, user);
    });

    const processedDeliveryStatus = message.deliveryStatus.map(
      (status: any) => ({
        ...status.toJSON(),
        user: usersMap.get(status.user.toString()),
      })
    );

    const statusCounts = {
      sent: 0,
      delivered: 0,
      read: 0,
    };

    message.deliveryStatus.forEach((status: any) => {
      statusCounts[status.status]++;
    });

    res.json({
      success: true,
      data: {
        messageId: message._id,
        deliveryStatus: processedDeliveryStatus,
        statusCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching message status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message status",
    });
  }
};

// Get message thread (replies to a message)
export const getMessageThreadByMsgID = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const token = req.headers.authorization?.replace("Bearer ", "") || "";

    // Check if original message exists
    const originalMessage = await Message.findById(msgID);

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: "Original message not found",
      });
    }

    // Check if message is deleted for this user
    if (originalMessage.isDeletedForUser(new Types.ObjectId(userId))) {
      return res.status(404).json({
        success: false,
        message: "Original message not found",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Get replies to this message
    const replies = await Message.find({
      replyTo: msgID,
      deletedFor: { $ne: new Types.ObjectId(userId) },
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit));

    const totalReplies = await Message.countDocuments({
      replyTo: msgID,
      deletedFor: { $ne: new Types.ObjectId(userId) },
    });

    // Get all unique user IDs
    const userIds = new Set<string>();
    userIds.add(originalMessage.senderId.toString());
    replies.forEach((reply) => {
      userIds.add(reply.senderId.toString());
      if (reply.mentions) {
        reply.mentions.forEach((mention) => userIds.add(mention.toString()));
      }
    });

    // Get all users info in batch
    const users = await getUsersByIds(Array.from(userIds), token);
    const usersMap = new Map();
    (users.data || users || []).forEach((user: any) => {
      usersMap.set(user._id || user.id, user);
    });

    // Process original message
    const processedOriginalMessage = {
      ...originalMessage.toJSON(),
      sender: usersMap.get(originalMessage.senderId.toString()),
    };

    // Process replies
    const processedReplies = replies.map((reply) => ({
      ...reply.toJSON(),
      sender: usersMap.get(reply.senderId.toString()),
      mentionedUsers:
        reply.mentions
          ?.map((id) => usersMap.get(id.toString()))
          .filter(Boolean) || [],
    }));

    res.json({
      success: true,
      data: {
        originalMessage: processedOriginalMessage,
        replies: processedReplies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalReplies,
          pages: Math.ceil(totalReplies / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching message thread:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message thread",
    });
  }
};

// Mark message as delivered (called by recipient)
export const markMessageAsDelivered = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(msgID);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await message.markAsDelivered(new Types.ObjectId(userId));

    res.json({
      success: true,
      message: "Message marked as delivered",
    });
  } catch (error) {
    console.error("Error marking message as delivered:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as delivered",
    });
  }
};

// Mark message as read (called by recipient)
export const markMessageAsRead = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { msgID } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(msgID);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await message.markAsRead(new Types.ObjectId(userId));

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
    });
  }
};
