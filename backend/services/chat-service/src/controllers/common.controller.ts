import axios from "axios";
import { Request, Response } from "express";
import { Chat, Document, IChat } from "../models/chat.model.js";
import { Schema, Types } from "mongoose";
import { isValid, sendError, sendSuccess } from "../utils/index.js";
import { fetchUserDetails } from "./private.controller.js";
import { ChatParticipant } from "../models/chat.particitipate.model.js";
import { getHeaderValue } from "./group.controller.js";
export interface AuthRequest extends Request {
  user?: any;
}

const USER_SERVICE = process.env.USER_SERVICE!;
// chat.model.ts (or similar)

export const getArchivedChatsByUserID = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = getHeaderValue(req.headers["x-user-id"]);
  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);
  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

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
    const users = await fetchUserDetails(
      Array.from(allUserIds),
      token,
      refreshToken
    );
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
          isArchived: cp?.isArchived,
          lastReadMessageId: cp?.lastReadMessageId,
          lastMessageType: chat?.lastMessageType || "text",
          lastActivity: chat?.lastActivity,
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
  } catch (error: any) {
    console.error("Error getting chats:", error.message);
    return sendError(res, "Failed to retrieve chats", 500, error);
  }
};
//The original
export const getAllChatsByUserID = async (req: AuthRequest, res: Response) => {
  const userId = req?.headers["x-user-id"];
  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);
  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

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
    const users = await fetchUserDetails(
      Array.from(allUserIds),
      token,
      refreshToken
    );
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
        const lastMessage = {
          text: chat.lastMessage || "",
          type: chat.lastMessageType || "Text",
          createdAt: chat.lastMessageAt,
        };

        return {
          chatId: chat?._id,
          type: chat?.type,
          chatName,
          chatImage,
          unreadCount: cp?.unreadCount || "0",
          isPinned: cp?.isPinned,
          isArchived: cp.isArchived,
          isMuted: cp.isMuted,
          lastMessage: lastMessage?.text,
          lastMessageType: lastMessage?.type || "text",
          lastMessageAt: lastMessage?.createdAt || Date.now(),
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
  } catch (error: any) {
    console.error("Error getting chats:", error.message);
    return sendError(res, "Failed to retrieve chats", 500, error);
  }
};
export const getAllChatIdsByUserID = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req?.headers["x-user-id"];
  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);
  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

  try {
    // 1️⃣ Get all chat participants for the user
    const chatParticipants = await ChatParticipant.find({
      userId,
      isArchived: { $ne: true },
    }).sort({ isPinned: -1, updatedAt: -1 });

    const rawChatIds = chatParticipants.map((cp) => cp.chatId);
    console.log({ rawChatIds });
    const chatIds = rawChatIds.map((id) => id.toString());
    console.log({ chatIds });

    return sendSuccess(
      res,
      {
        chatIds,
      },
      "ChatIds retrieved successfully",
      200
    );
  } catch (error: any) {
    console.error("Error getting chats:", error.message);
    return sendError(res, "Failed to retrieve chats", 500, error);
  }
};

//Testing
export const getAllChatsByUserIDPage = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req?.headers["x-user-id"];
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);
  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

  try {
    // 1️⃣ Fetch chatParticipants with pagination
    const chatParticipants = await ChatParticipant.find({
      userId,
      isArchived: { $ne: true },
    })
      .sort({ isPinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // 2️⃣ Get chatIds
    const chatIds = chatParticipants.map((cp) => cp.chatId);

    // 3️⃣ Fetch chats
    const chats = await Chat.find({ _id: { $in: chatIds } })
      .populate("lastMessage")
      .lean();

    // 4️⃣ Collect user IDs for private chats
    const allUserIds = new Set<string>();
    chats.forEach((chat) => {
      chat.participants.forEach((p) => {
        if (p.isActive) allUserIds.add(p.user.toString());
      });
    });

    // 5️⃣ Fetch user details
    const users = await fetchUserDetails(
      Array.from(allUserIds),
      token,
      refreshToken
    );
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // 6️⃣ Build chat list
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
        const lastMessage = {
          text: chat.lastMessage || "",
          type: chat.lastMessageType || "Text",
          createdAt: chat.lastMessageAt,
        };

        return {
          chatId: chat?._id,
          type: chat?.type,
          chatName,
          chatImage,
          unreadCount: cp?.unreadCount || "0",
          isPinned: cp?.isPinned,
          isArchived: cp.isArchived,
          isMuted: cp.isMuted,
          lastMessage: lastMessage?.text,
          lastMessageType: lastMessage?.type || "text",
          lastMessageAt: lastMessage?.createdAt || Date.now(),
        };
      })
      .filter(Boolean);

    // 7️⃣ Total count (for frontend infinite scroll)
    const totalChats = await ChatParticipant.countDocuments({
      userId,
      isArchived: { $ne: true },
    });
    //page, and limit won't change seperatly, infrontend we can fix per page(per request) how many items we want(limit) and for next page or next request, limit will not change.
    //     If you fetched 10 per page, and total is 23:

    // Page 1: 1 * 10 < 23 → true ✅ =>hasMore = true

    // Page 2: 2 * 10 < 23 → true ✅=>hasMore = true

    // Page 3: 3 * 10 < 23 → false ❌=>hasMore = false

    // So page 3 will be the last.
    // Calculate hasMore properly
    const hasMore = page * limit < totalChats;
    // 8️⃣ Return response
    return sendSuccess(
      res,
      {
        chats: chatList,
        page,
        limit,
        total: totalChats,
        hasMore,
        remaining: Math.max(totalChats - page * limit, 0), // extra info: remaining items
        totalPages: Math.ceil(totalChats / limit),
      },
      "Chats retrieved successfully",
      200
    );
  } catch (error: any) {
    console.error("Error getting chats:", error.message);
    return sendError(res, "Failed to retrieve chats", 500, error);
  }
};
