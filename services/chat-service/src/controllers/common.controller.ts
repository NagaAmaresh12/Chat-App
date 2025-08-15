import axios from "axios";
import { Request, Response } from "express";
import { Chat, Document, IChat } from "../models/chat.model.js";
import { Schema, Types } from "mongoose";
import { isValid, sendError, sendSuccess } from "../utils/index.js";
import { fetchUserDetails } from "./private.controller.js";
import { ChatParticipant } from "../models/chat.particitipate.model.js";
export interface AuthRequest extends Request {
  user?: any;
}

const USER_SERVICE = process.env.USER_SERVICE!;
// chat.model.ts (or similar)

export const getArchivedChatsByUserID = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user.id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  try {
    // 1️⃣ Get all chat participants for the user
    const chatParticipants = await ChatParticipant.find({
      userId,
      isArchived: { $eq: true },
    }).sort({ isPinned: -1, updatedAt: -1 });

    const chatIds = chatParticipants.map((cp) => cp.chatId);

    // 2️⃣ Get all chats for these IDs
    const chats = await Chat.find({ _id: { $in: chatIds } })
      .populate("lastMessage") // optional: populate if lastMessage is a ref
      .lean();

    // 3️⃣ Collect unique user IDs for private chats
    const allUserIds = new Set<string>();
    chats.forEach((chat) => {
      chat.participants.forEach((p) => {
        if (p.isActive) allUserIds.add(p.user.toString());
      });
    });

    // 4️⃣ Fetch user details in bulk
    const users = await fetchUserDetails(Array.from(allUserIds), token);
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // 5️⃣ Build WhatsApp-style chat list
    const chatList = chatParticipants
      .map((cp) => {
        const chat = chats.find(
          (c) => c._id.toString() === cp.chatId.toString()
        );
        if (!chat) return null;

        const isGroup = chat.type === "group";

        let chatName = "";
        let chatImage = "";

        if (isGroup) {
          chatName = chat?.groupName || "Unnamed Group";
          chatImage = chat?.groupAvatar || "/default-group.png";
        } else {
          // Private chat → find the other participant
          const otherParticipant = chat.participants.find(
            (p) => p.user.toString() !== userId
          );
          const otherUser = otherParticipant
            ? userMap.get(otherParticipant.user.toString())
            : null;

          chatName = otherUser?.username || "Unknown User";
          chatImage = otherUser?.avatar || "/default-avatar.png";
        }

        // Last message details
        const lastMessage = chat.lastMessage
          ? {
              text: chat?.lastMessage || "",
              createdAt: chat?.lastActivity || "",
              // status: chat.lastMessage?.status, // e.g., sent, delivered, read
            }
          : null;

        return {
          chatId: chat?._id,
          type: chat?.type,
          chatName,
          chatImage,
          lastMessage,
          unreadCount: cp?.unreadCount,
          isPinned: cp?.isPinned,
          // isArchived: cp.isArchived,
          lastReadMessageId: cp?.lastReadMessageId,
        };
      })
      .filter(Boolean);

    return sendSuccess(
      res,
      {
        chats: chatList,
        count: chatList.length,
      },
      "Chats retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Error getting chats:", error);
    return sendError(res, "Failed to retrieve chats", 500, error);
  }
};

export const getAllChatsByUserID = async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  try {
    // 1️⃣ Get all chat participants for the user
    const chatParticipants = await ChatParticipant.find({
      userId,
      isArchived: { $ne: true },
    }).sort({ isPinned: -1, updatedAt: -1 });

    const chatIds = chatParticipants.map((cp) => cp.chatId);

    // 2️⃣ Get all chats for these IDs
    const chats = await Chat.find({ _id: { $in: chatIds } })
      .populate("lastMessage") // optional: populate if lastMessage is a ref
      .lean();

    // 3️⃣ Collect unique user IDs for private chats
    const allUserIds = new Set<string>();
    chats.forEach((chat) => {
      chat.participants.forEach((p) => {
        if (p.isActive) allUserIds.add(p.user.toString());
      });
    });

    // 4️⃣ Fetch user details in bulk
    const users = await fetchUserDetails(Array.from(allUserIds), token);
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // 5️⃣ Build WhatsApp-style chat list
    const chatList = chatParticipants
      .map((cp) => {
        const chat = chats.find(
          (c) => c._id.toString() === cp.chatId.toString()
        );
        if (!chat) return null;

        const isGroup = chat.type === "group";

        let chatName = "";
        let chatImage = "";

        if (isGroup) {
          chatName = chat?.groupName || "Unnamed Group";
          chatImage = chat?.groupAvatar || "/default-group.png";
        } else {
          // Private chat → find the other participant
          const otherParticipant = chat.participants.find(
            (p) => p.user.toString() !== userId
          );
          const otherUser = otherParticipant
            ? userMap.get(otherParticipant.user.toString())
            : null;

          chatName = otherUser?.username || "Unknown User";
          chatImage = otherUser?.avatar || "/default-avatar.png";
        }

        // Last message details
        const lastMessage = chat.lastMessage
          ? {
              text: chat?.lastMessage || "",
              createdAt: chat?.lastActivity || "",
              // status: chat.lastMessage?.status, // e.g., sent, delivered, read
            }
          : null;

        return {
          chatId: chat?._id,
          type: chat?.type,
          chatName,
          chatImage,
          lastMessage,
          unreadCount: cp?.unreadCount,
          isPinned: cp?.isPinned,
          // isArchived: cp.isArchived,
          lastReadMessageId: cp?.lastReadMessageId,
        };
      })
      .filter(Boolean);

    return sendSuccess(
      res,
      {
        chats: chatList,
        count: chatList.length,
      },
      "Chats retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Error getting chats:", error);
    return sendError(res, "Failed to retrieve chats", 500, error);
  }
};
