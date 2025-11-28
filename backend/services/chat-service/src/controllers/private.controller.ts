import axios from "axios";
import { Request, Response } from "express";
import { Chat } from "../models/chat.model.js";
import { Schema, Types } from "mongoose";
import { isValid, sendError, sendSuccess } from "../utils/index.js";
import { ChatParticipant } from "../models/chat.particitipate.model.js";

export interface AuthRequest extends Request {
  user?: any;
}

const USER_SERVICE = process.env.USERS_SERVICE!;

// Helper function to fetch user details
export const fetchUserDetails = async (
  userIds: string[],
  token: string,
  refreshToken: string
) => {
  try {
    // Batch endpoint would be more efficient
    const userPromises = userIds.map((userId) =>
      axios.get(`${USER_SERVICE}/people/${userId}`, {
        //............... axios.get(...) returns a Promise (because it’s asynchronous).
        headers: {
          Authorization: `Bearer ${token}`,
          "x-refresh-token": refreshToken,
        },
      })
    );

    // So userPromises becomes an array of Promises, like:
    // [
    //   Promise<pending>,
    //   Promise<pending>,
    //   Promise<pending>,
    //   ...
    // ]
    // when we use promise.all, All requests fired at once.Instead of calling each request,at once until one finished,we get this when we use "for,while loop"

    const responses = await Promise.all(userPromises); //All requests fired at once.
    return responses.map((res) => res.data?.data).filter(Boolean); //[ { name: "John", id: "123" }, { name: "Ava", id: "456" }, undefined, null ], if api call failed or didn't return any data, we get values likes undefined or null, so we want to select only values which are correct, That's why we use Boolean here
  } catch (error: any) {
    console.error("Error fetching user details:", error.message);
    return [];
  }
};

// Helper function to populate chat with user details
const populateChatWithUsers = async (
  chat: any,
  token: string,
  refreshToken: string
) => {
  const userIds = chat.participants.map((p: any) => p.user.toString());
  const users = await fetchUserDetails(userIds, token, refreshToken);

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

export const createNewPrivateChat = async (req: AuthRequest, res: Response) => {
  const { participantID } = req.body;
  const senderId = req.headers["x-user-id"] as string;

  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);
  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

  console.log("In createNewPrivateChat", {
    token,
    refreshToken,
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
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-refresh-token": refreshToken,
        },
      }
    );

    console.log("====================================");
    console.log({ userData: data });
    console.log("====================================");
    const participant = data?.data;
    if (!participant) {
      return sendError(res, "Participant does not exist", 400);
    }

    // Check if chat already exists
    let existingChat = await Chat.findOne({
      type: "private",
      "participants.user": { $all: [senderId, participantID] }, //This $all condition ensures that both users are in the chat, regardless of their order.
      "participants.isActive": true, //Find a chat document where at least one element in the participants array has isActive: true.
    });
    console.log("====================================");
    console.log({ existingChat });
    console.log("====================================");
    if (existingChat) {
      // Populate with user details
      const populatedChat = await populateChatWithUsers(
        existingChat,
        token!,
        refreshToken
      );
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
          isActive: true, //this checking active is not for user active or using this app,it is about whether that user is in the chat or blocked this chat
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
    const populatedChat = await populateChatWithUsers(
      newChat,
      token!,
      refreshToken
    );

    return sendSuccess(
      res,
      { chat: populatedChat },
      "Chat created successfully",
      200
    );
  } catch (error: any) {
    console.error("Error creating private chat:", error.message);
    return sendError(res, "Failed to create chat", 500, error);
  }
};

export const getPrivateChatsByUserID = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.headers["x-user-id"] as string;
  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);
  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

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
    const users = await fetchUserDetails(
      Array.from(allUserIds),
      token,
      refreshToken
    );
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
  } catch (error: any) {
    console.error("Error getting private chats:", error.message);
    return sendError(res, "Failed to retrieve chats", 500, error);
  }
};

export const getPrivateChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {
  console.log("Request comes here");

  const { chatID } = req?.params;
  console.log({ chatID });

  const userId = req.headers["x-user-id"];
  console.log({ userId });

  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);
  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

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
    const populatedChat = await populateChatWithMinimalUserData(
      chat,
      token,
      refreshToken
    );

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
  } catch (error: any) {
    console.error("Error getting private chat:", error.message);
    return sendError(res, "Failed to retrieve chat", 500, error);
  }
};

// Helper function to populate chat with minimal user data
const populateChatWithMinimalUserData = async (
  chat: any,
  token: string,
  refreshToken: string
) => {
  try {
    const USER_SERVICE = process.env.USERS_SERVICE!;

    // Get user IDs from participants
    const userIds = chat.participants.map((p: any) => p.user.toString());

    // Make batch request to user service for minimal user data
    const userPromises = userIds.map(async (userId: string) => {
      try {
        const response = await axios.get(`${USER_SERVICE}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-refresh-token": refreshToken,
          },
          timeout: 5000,
        });
        return response.data.data;
      } catch (error: any) {
        console.error(`Error fetching user ${userId}:`, error.message);
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
  } catch (error: any) {
    console.error("Error populating chat with user data:", error.message);
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
export const getPrivateChatByChatIDAlternative = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const userId = req.user.id;
  const token =
    req?.cookies?.accessToken ||
    req?.cookies?.refreshToken ||
    (req?.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined);
  const refreshToken =
    req?.body?.refreshToken || req?.headers["x-refresh-token"];

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
    const populatedChat = await populateChatWithUsers(
      chat,
      token,
      refreshToken
    );

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
  } catch (error: any) {
    console.error("Error getting private chat:", error.message);
    return sendError(res, "Failed to retrieve chat", 500, error);
  }
};

export const editPrivateChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const {
    isArchived,
    isMuted,
    isPinned,
    isBlocked,
    lastMessage,
    lastMessageAt,
    lastMessageType,
  } = req.body;
  const userId = req.headers["x-user-id"];

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
    // 1️⃣ Update Chat model with last message info
    const chatUpdates: any = {};
    if (lastMessage) chatUpdates.lastMessage = lastMessage;
    if (lastMessageType) chatUpdates.lastMessageType = lastMessageType;
    if (lastMessageAt) chatUpdates.lastMessageAt = lastMessageAt;

    if (Object.keys(chatUpdates).length > 0) {
      await Chat.findByIdAndUpdate(chatID, chatUpdates, { new: true });
    }

    // Update user's chat participant settings
    const participantUpdates: any = {};
    if (typeof isArchived === "boolean")
      participantUpdates.isArchived = isArchived;
    if (typeof isBlocked === "boolean")
      participantUpdates.isBlocked = isBlocked;
    if (typeof isMuted === "boolean") participantUpdates.isMuted = isMuted;
    if (typeof isPinned === "boolean") {
      participantUpdates.isPinned = isPinned;
      if (isPinned) participantUpdates.pinnedAt = new Date();
    }

    const updatedChatParticipant = await ChatParticipant.findOneAndUpdate(
      { chatId: chatID, userId: userId },
      participantUpdates,
      { new: true, upsert: true }
    );

    return sendSuccess(
      res,
      { chatParticipant: updatedChatParticipant },
      "Chat settings updated successfully",
      200
    );
  } catch (error: any) {
    console.error("Error editing private chat:", error.message);
    return sendError(res, "Failed to update chat settings", 500, error);
  }
};

//we don't delete the chat but we don't show or hide the chat, making isActive:false to that user who wants this chat not to visible
export const deletePrivateChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const userIdHeader = req.headers["x-user-id"];

  // ✅ Ensure userId and chatID are valid
  if (
    !chatID ||
    typeof chatID !== "string" ||
    !Types.ObjectId.isValid(chatID)
  ) {
    return sendError(res, "Invalid or missing chat ID", 400);
  }

  if (
    !userIdHeader ||
    typeof userIdHeader !== "string" ||
    !Types.ObjectId.isValid(userIdHeader)
  ) {
    return sendError(res, "Invalid or missing user ID", 400);
  }

  const chatObjectId = new Types.ObjectId(chatID);
  const userObjectId = new Types.ObjectId(userIdHeader);

  try {
    console.log("Trying to delete chat...");

    // ✅ Find the chat and verify user is a participant
    const chat = await Chat.findOne({
      _id: chatObjectId,
      type: "private",
      "participants.user": userObjectId,
      "participants.isActive": true,
    });

    if (!chat) {
      return sendError(res, "Chat not found or access denied", 404);
    }

    // ✅ Remove user from participants (soft delete)
    await chat.removeParticipant(userObjectId);

    // ✅ Archive user’s ChatParticipant entry
    await ChatParticipant.findOneAndUpdate(
      { chatId: chatObjectId, userId: userObjectId },
      { isArchived: true }
    );

    return sendSuccess(res, "Chat deleted successfully");
  } catch (error: any) {
    console.error("Error deleting private chat:", error.message);
    return sendError(res, "Failed to delete chat", 500, error);
  }
};
