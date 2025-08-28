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

// Helper function to fetch user details
export const fetchUserDetails = async (userIds: string[], token: string) => {
  try {
    // Batch endpoint would be more efficient
    const userPromises = userIds.map((userId) =>
      axios.get(`${USER_SERVICE}/people/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    const responses = await Promise.all(userPromises);
    return responses.map((res) => res.data?.data).filter(Boolean);
  } catch (error) {
    console.error("Error fetching user details:", error);
    return [];
  }
};

// Helper function to populate chat with user details
const populateChatWithUsers = async (chat: any, token: string) => {
  const userIds = chat.participants.map((p: any) => p.user.toString());
  const users = await fetchUserDetails(userIds, token);

  // Map users back to participants
  const populatedParticipants = chat.participants.map((participant: any) => {
    const user = users.find((u) => u._id === participant.user.toString());
    return {
      ...participant.toObject(),
      user: user || { _id: participant.user }, // Fallback if user not found
    };
  });

  return {
    ...chat.toObject(),
    participants: populatedParticipants,
  };
};

export const createNewprivateChat = async (req: AuthRequest, res: Response) => {
  const { participantID } = req.body;
  const senderId = req.user.id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;
  console.log("In createNewPrivateChat", {
    token,
  });

  console.log({ senderId, participantID });

  if (!isValid(senderId) || !isValid(participantID)) {
    return sendError(res, "Invalid inputs", 400);
  }

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
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const participant = data?.data;
    if (!participant) {
      return sendError(res, "Participant does not exist", 400);
    }

    // Check if chat already exists
    let existingChat = await Chat.findOne({
      type: "private",
      "participants.user": { $all: [senderId, participantID] },
      "participants.isActive": true,
    });

    if (existingChat) {
      // Populate with user details
      const populatedChat = await populateChatWithUsers(existingChat, token);
      return sendSuccess(
        res,
        { chat: populatedChat },
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
          role: "member",
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

    // Create ChatParticipant entries
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

    // Populate the created chat with user details
    const populatedChat = await populateChatWithUsers(newChat, token);

    return sendSuccess(
      res,
      { chat: populatedChat },
      "Chat created successfully",
      200
    );
  } catch (error) {
    console.error("Error creating private chat:", error);
    return sendError(res, "Failed to create chat", 500, error);
  }
};

export const getprivateChatsByUserID = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user.id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  try {
    // Get all chat participants for the user
    const chatParticipants = await ChatParticipant.find({
      userId: userId,
      isArchived: { $ne: true },
    }).sort({ isPinned: -1, updatedAt: -1 });

    // Get chat IDs
    const chatIds = chatParticipants.map((cp) => cp.chatId);

    // Get all chats
    const chats = await Chat.find({
      _id: { $in: chatIds },
      type: "private",
    });

    // Collect all unique user IDs from all chats
    const allUserIds = new Set<string>();
    chats.forEach((chat) => {
      chat.participants.forEach((p) => {
        if (p.isActive) allUserIds.add(p.user.toString());
      });
    });

    // Fetch all users in batch (more efficient)
    const users = await fetchUserDetails(Array.from(allUserIds), token);
    const userMap = new Map(users.map((u) => [u._id, u]));

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

export const getprivateChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const userId = req.user.id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  if (!Types.ObjectId.isValid(chatID!)) {
    return sendError(res, "Invalid chat ID", 400);
  }

  try {
    // Find the chat with only necessary fields
    const chat = await Chat.findOne({
      _id: chatID,
      type: "private",
      "participants.user": userId,
      "participants.isActive": true,
    }).select("_id type lastActivity participants");

    if (!chat) {
      return sendError(res, "Chat not found or access denied", 404);
    }

    // Get user's chat participant info
    const chatParticipant = await ChatParticipant.findOne({
      chatId: chatID,
      userId: userId,
    }).select("unreadCount isMuted isPinned");

    // Populate with minimal user details
    const populatedChat = await populateChatWithMinimalUserData(chat, token);

    // Create optimized response
    const responseData = {
      chat: {
        _id: populatedChat._id,
        type: populatedChat.type,
        lastActivity: populatedChat.lastActivity,
        participants: populatedChat.participants.map((participant: any) => ({
          user: {
            _id: participant.user._id,
            username: participant.user.username,
            avatar: participant.user.avatar || "",
            isOnline: participant.user.isOnline,
          },
          role: participant.role,
          isActive: participant.isActive,
        })),
      },
      userChatInfo: {
        unreadCount: chatParticipant?.unreadCount || 0,
        isMuted: chatParticipant?.isMuted || false,
        isPinned: chatParticipant?.isPinned || false,
      },
    };

    return sendSuccess(res, responseData, "Chat retrieved successfully");
  } catch (error) {
    console.error("Error getting private chat:", error);
    return sendError(res, "Failed to retrieve chat", 500, error);
  }
};

// Helper function to populate chat with minimal user data
const populateChatWithMinimalUserData = async (chat: any, token: string) => {
  try {
    const USER_SERVICE = process.env.USER_SERVICE!;

    // Get user IDs from participants
    const userIds = chat.participants.map((p: any) => p.user.toString());

    // Make batch request to user service for minimal user data
    const userPromises = userIds.map(async (userId: string) => {
      try {
        const response = await axios.get(
          `${USER_SERVICE}/users/${userId}/minimal`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000,
          }
        );
        return response.data.data;
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        // Return fallback user data
        return {
          _id: userId,
          username: "Unknown User",
          avatar: "",
          isOnline: false,
        };
      }
    });

    const users = await Promise.all(userPromises);

    // Create user map for easy lookup
    const userMap = users.reduce((acc: any, user: any) => {
      acc[user._id] = user;
      return acc;
    }, {});

    // Populate participants with user data
    const populatedParticipants = chat.participants.map((participant: any) => ({
      ...participant.toObject(),
      user: userMap[participant.user.toString()] || {
        _id: participant.user.toString(),
        username: "Unknown User",
        avatar: "",
        isOnline: false,
      },
    }));

    return {
      ...chat.toObject(),
      participants: populatedParticipants,
    };
  } catch (error) {
    console.error("Error populating chat with user data:", error);
    // Return chat with fallback user data
    const fallbackParticipants = chat.participants.map((participant: any) => ({
      ...participant.toObject(),
      user: {
        _id: participant.user.toString(),
        username: "Unknown User",
        avatar: "",
        isOnline: false,
      },
    }));

    return {
      ...chat.toObject(),
      participants: fallbackParticipants,
    };
  }
};

// Alternative version if you prefer to modify your existing populateChatWithUsers function
export const getprivateChatByChatIDAlternative = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const userId = req.user.id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  if (!Types.ObjectId.isValid(chatID!)) {
    return sendError(res, "Invalid chat ID", 400);
  }

  try {
    // Find the chat
    const chat = await Chat.findOne({
      _id: chatID,
      type: "private",
      "participants.user": userId,
      "participants.isActive": true,
    });

    if (!chat) {
      return sendError(res, "Chat not found or access denied", 404);
    }

    // Populate with user details (using your existing function)
    const populatedChat = await populateChatWithUsers(chat, token);

    // Get user's chat participant info
    const chatParticipant = await ChatParticipant.findOne({
      chatId: chatID,
      userId: userId,
    });

    // Filter and format response to include only necessary fields
    const optimizedResponseData = {
      chat: {
        _id: populatedChat._id,
        type: populatedChat.type,
        lastActivity: populatedChat.lastActivity,
        participants: populatedChat.participants
          .filter((participant: any) => participant.isActive) // Only active participants
          .map((participant: any) => ({
            user: {
              _id: participant.user._id,
              username: participant.user.username,
              avatar: participant.user.avatar || "",
              isOnline: participant.user.isOnline || false,
            },
            role: participant.role,
            isActive: participant.isActive,
          })),
      },
      userChatInfo: {
        unreadCount: chatParticipant?.unreadCount || 0,
        isMuted: chatParticipant?.isMuted || false,
        isPinned: chatParticipant?.isPinned || false,
      },
    };

    return sendSuccess(
      res,
      optimizedResponseData,
      "Chat retrieved successfully",
      200
    );
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
      { chatParticipant: updatedChatParticipant },
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
    console.log("trying to delete chat.......");

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
