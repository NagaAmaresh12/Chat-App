import axios from "axios";
import { Request, Response } from "express";
import { Chat } from "../models/chat.model.js";
import { Schema, Types } from "mongoose";
import { isValid, sendError, sendSuccess } from "../utils/index.js";
import { fetchUserDetails } from "./private.controller.js";
import { ChatParticipant } from "../models/chat.particitipate.model.js";
export interface AuthRequest extends Request {
  user?: any;
}

const USER_SERVICE = process.env.USER_SERVICE!;

export const getArchivedChatsByUserID = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user.id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  try {
    // Get all chat participants for the user
    const chatParticipants = await ChatParticipant.find({
      userId: userId,
      isArchived: { $eq: true },
    }).sort({ isPinned: -1, updatedAt: -1 });
    console.log({ chatParticipants });

    // Get chat IDs
    // const chatIds = chatParticipants.map((cp) => cp.chatId);

    // // Get all chats
    // const chats = await Chat.find({
    //   _id: { $in: chatIds },
    //   type: "private",
    // });

    // // Collect all unique user IDs from all chats
    // const allUserIds = new Set<string>();
    // chats.forEach((chat) => {
    //   chat.participants.forEach((p) => {
    //     if (p.isActive) allUserIds.add(p.user.toString());
    //   });
    // });

    // // Fetch all users in batch (more efficient)
    // const users = await fetchUserDetails(Array.from(allUserIds), token);
    // const userMap = new Map(users.map((u) => [u._id, u]));

    // // Map and populate chats
    // const validChats = chatParticipants
    //   .map((cp) => {
    //     const chat = chats?.find((c) => c._id == cp.chatId.toString());
    //     if (!chat) return null;

    //     // Populate participants
    //     const populatedParticipants = chat.participants.map((p) => ({
    //       ...p,
    //       user: userMap.get(p.user.toString()) || { _id: p.user },
    //     }));

    //     return {
    //       chat: {
    //         ...chat.toObject(),
    //         participants: populatedParticipants,
    //       },
    //       unreadCount: cp.unreadCount,
    //       isMuted: cp.isMuted,
    //       isArchived: cp.isArchived,
    //       isPinned: cp.isPinned,
    //       lastReadMessageId: cp.lastReadMessageId,
    //     };
    //   })
    //   .filter(Boolean);

    // return sendSuccess(
    //   res,
    //   {
    //     chats: validChats,
    //     count: validChats.length,
    //   },
    //   "private chats retrieved successfully",
    //   200
    // );
  } catch (error) {
    console.error("Error getting private chats:", error);
    return sendError(res, "Failed to retrieve chats", 500, error);
  }
};

export const getAllChatsByUserID = async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  try {
    // Get all chat participants for the user
    const chatParticipants = await ChatParticipant.find({
      userId: userId,
      isArchived: { $ne: true },
    }).sort({ isPinned: -1, updatedAt: -1 });
    console.log({ chatParticipants });
    res.status(200).json({
      message: "check data",
      chatParticipants,
    });
    // Get chat IDs
    const chatIds = chatParticipants.map((cp) => cp.chatId);

    // // Get all chats
    const chats = await Chat.find({
      _id: { $in: chatIds },
      //   type: "private",
    });

    // // Collect all unique user IDs from all chats
    const allUserIds = new Set<string>();
    chats.forEach((chat) => {
      chat.participants.forEach((p) => {
        if (p.isActive) allUserIds.add(p.user.toString());
      });
    });

    // // Fetch all users in batch (more efficient)
    const users = await fetchUserDetails(Array.from(allUserIds), token);
    console.log({
      users,
    });

    const userMap = new Map(users.map((u) => [u._id, u]));
    console.log({
      userMap,
    });

    // Map and populate chats
    const validChats = chatParticipants
      .map((cp) => {
        const chat = chats?.find((c) => c._id == cp.chatId.toString());
        if (!chat) return null;

        // Populate participants
        const populatedParticipants = chat.participants.map((p) => ({
          ...p,
          user: userMap.get(p.user.toString()) || { _id: p.user },
        }));

        return {
          chat: {
            ...chat.toObject(),
            participants: populatedParticipants,
          },
          unreadCount: cp.unreadCount,
          isMuted: cp.isMuted,
          isArchived: cp.isArchived,
          isPinned: cp.isPinned,
          lastReadMessageId: cp.lastReadMessageId,
        };
      })
      .filter(Boolean);

    return sendSuccess(
      res,
      {
        chats: validChats,
        count: validChats.length,
      },
      "private chats retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Error getting private chats:", error);
    return sendError(res, "Failed to retrieve chats", 500, error);
  }
};
