import axios from "axios";
import { Request, Response } from "express";
import { Chat } from "../models/chat.model.js";
import { Schema, Types } from "mongoose";
import { isValid, sendError, sendSuccess } from "../utils/index.js";
import { ChatParticipant } from "../models/chat.particitipate.model.js";
export interface AuthRequest extends Request {
  user?: any;
}
const USER_SERVICE = process.env.USER_SERVICE!;
export const createNewprivateChat = async (req: AuthRequest, res: Response) => {
  const { participantID } = req.body; // Changed from receiverId to match schema
  const senderId = req.user.id; // Changed from id to _id (MongoDB standard)

  console.log({
    senderId,
    participantID,
  });

  if (!isValid(senderId) || !isValid(participantID)) {
    return sendError(res, "Invalid inputs", 400);
  }

  // Check if user is trying to create chat with themselves
  if (senderId.toString() === participantID.toString()) {
    return sendError(res, "Cannot create chat with yourself", 400);
  }

  if (!USER_SERVICE) {
    return sendError(res, "Invalid USER_SERVICE endpoint", 500);
  }

  try {
    // Verify participant exists
    const { data } = await axios.get(
      `${USER_SERVICE}/people/${participantID}`,
      {
        headers: {
          Authorization: `Bearer ${
            req?.cookies?.accessToken || req?.cookies?.refreshToken
          }`,
        },
      }
    );

    const participant = data?.data;
    if (!participant) {
      return sendError(res, "Participant does not exist", 400);
    }

    // Check if chat already exists between these two users
    let existingChat = await Chat.findOne({
      type: "private",
      "participants.user": { $all: [senderId, participantID] },
      "participants.isActive": true,
    }).populate("participants.user", "username displayName avatar");

    if (existingChat) {
      return sendSuccess(
        res,
        { chat: existingChat },
        "Chat already exists",
        200
      );
    }

    // Create new private chat
    const newChat = await Chat.create({
      type: "private",
      participants: [
        {
          user: senderId,
          role: "member", // In private chats, both are members
          isActive: true,
        },
        {
          user: participantID,
          role: "member",
          isActive: true,
        },
      ],
      lastActivity: new Date(),
    });

    // Create ChatParticipant entries for both users
    await ChatParticipant.create([
      {
        chatId: newChat._id,
        userId: senderId,
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
      },
      {
        chatId: newChat._id,
        userId: participantID,
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
      },
    ]);

    // Populate the created chat
    const populatedChat = await Chat.findById(newChat._id).populate(
      "participants.user",
      "username displayName avatar isOnline lastSeen"
    );

    return sendSuccess(
      res,
      {
        chat: populatedChat,
      },
      "Chat created successfully",
      200
    );
  } catch (error) {
    console.error("Error creating private chat:", error);
    return sendError(res, "Failed to create chat", 500, error);
  }
};
//multiple chats By UserID
export const getprivateChatsByUserID = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user.id;

  try {
    // Get all private chats for the user with participant details
    const chatParticipants = await ChatParticipant.find({
      userId: userId,
      isArchived: { $ne: true }, // Exclude archived chats
    })
      .populate({
        path: "chatId",
        match: { type: "private" },
        populate: {
          path: "participants.user",
          select: "username displayName avatar isOnline lastSeen",
        },
      })
      .sort({ isPinned: -1, updatedAt: -1 });

    // Filter out null chatIds (from non-private chats)
    const validChats = chatParticipants
      .filter((cp) => cp.chatId !== null)
      .map((cp) => ({
        chat: cp.chatId,
        unreadCount: cp.unreadCount,
        isMuted: cp.isMuted,
        isArchived: cp.isArchived,
        isPinned: cp.isPinned,
        lastReadMessageId: cp.lastReadMessageId,
      }));

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
//one chat BY ChatID
export const getprivateChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const userId = req.user.id;

  if (!Types.ObjectId.isValid(chatID!)) {
    return sendError(res, "Invalid chat ID", 400);
  }

  try {
    // Find the chat and verify user is a participant
    const chat = await Chat.findOne({
      _id: chatID,
      type: "private",
      "participants.user": userId,
      "participants.isActive": true,
    }).populate(
      "participants.user",
      "username displayName avatar isOnline lastSeen"
    );

    if (!chat) {
      return sendError(res, "Chat not found or access denied", 404);
    }

    // Get user's chat participant info
    const chatParticipant = await ChatParticipant.findOne({
      chatId: chatID,
      userId: userId,
    });

    const responseData = {
      chat,
      userChatInfo: {
        unreadCount: chatParticipant?.unreadCount || 0,
        isMuted: chatParticipant?.isMuted || false,
        isArchived: chatParticipant?.isArchived || false,
        isPinned: chatParticipant?.isPinned || false,
        lastReadMessageId: chatParticipant?.lastReadMessageId,
      },
    };

    return sendSuccess(res, responseData, "Chat retrieved successfully", 200);
  } catch (error) {
    console.error("Error getting private chat:", error);
    return sendError(res, "Failed to retrieve chat", 500, error);
  }
};
export const editprivateChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const { isArchived, isMuted, isPinned } = req.body;
  const userId = req.user.id;

  if (!Types.ObjectId.isValid(chatID!)) {
    return sendError(res, "Invalid chat ID", 400);
  }

  try {
    // Verify user is participant in the chat
    const chat = await Chat.findOne({
      _id: chatID,
      type: "private",
      "participants.user": userId,
      "participants.isActive": true,
    });

    if (!chat) {
      return sendError(res, "Chat not found or access denied", 404);
    }

    // Update user's chat participant settings
    const updateData: any = {};
    if (typeof isArchived === "boolean") updateData.isArchived = isArchived;
    if (typeof isMuted === "boolean") updateData.isMuted = isMuted;
    if (typeof isPinned === "boolean") {
      updateData.isPinned = isPinned;
      if (isPinned) updateData.pinnedAt = new Date();
    }

    const updatedChatParticipant = await ChatParticipant.findOneAndUpdate(
      { chatId: chatID, userId: userId },
      updateData,
      { new: true, upsert: true }
    );

    return sendSuccess(
      res,
      {
        chatParticipant: updatedChatParticipant,
      },
      "Chat settings updated successfully",
      200
    );
  } catch (error) {
    console.error("Error editing private chat:", error);
    return sendError(res, "Failed to update chat settings", 500, error);
  }
};

export const deleteprivateChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const userId = req.user.id;

  if (!Types.ObjectId.isValid(chatID!)) {
    return sendError(res, "Invalid chat ID", 400);
  }

  try {
    // Find the chat and verify user is a participant
    const chat = await Chat.findOne({
      _id: chatID,
      type: "private",
      "participants.user": userId,
      "participants.isActive": true,
    });

    if (!chat) {
      return sendError(res, "Chat not found or access denied", 404);
    }

    // Remove user from chat participants (soft delete)
    await chat.removeParticipant(userId);

    // Remove or archive user's ChatParticipant entry
    await ChatParticipant.findOneAndUpdate(
      { chatId: chatID, userId: userId },
      { isArchived: true }
    );

    return sendSuccess(res, "Chat deleted successfully");
  } catch (error) {
    console.error("Error deleting private chat:", error);
    return sendError(res, "Failed to delete chat", 500, error);
  }
};
