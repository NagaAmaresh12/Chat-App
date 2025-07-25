import { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/index.js";
import axios from "axios";
import { Types } from "mongoose";
import { Chat } from "../models/chat.model.js";
import { ChatParticipant } from "../models/chat.particitipate.model.js";

interface AuthRequest extends Request {
  user?: any;
}

const USER_SERVICE = process.env.USER_SERVICE!;

// Helper function to fetch user details
const fetchUserDetails = async (userIds: string[], token: string) => {
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
  const userIds = chat.participants
    .filter((p: any) => p.isActive)
    .map((p: any) => p.user.toString());

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

export const createNewGroupChat = async (req: AuthRequest, res: Response) => {
  const { name, members, description } = req.body;
  const creatorId = req.user._id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  try {
    if (!USER_SERVICE) {
      return sendError(res, "Invalid USER_SERVICE endpoint", 500);
    }

    // Add creator to members if not already included
    const allMembers = members.includes(creatorId.toString())
      ? members
      : [creatorId.toString(), ...members];

    // Verify all members exist
    const memberPromises = allMembers.map(async (memberId: string) => {
      try {
        const { data } = await axios.get(`${USER_SERVICE}/people/${memberId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return data?.data ? memberId : null;
      } catch {
        return null;
      }
    });

    const validMembers = (await Promise.all(memberPromises)).filter(Boolean);

    if (validMembers.length < 2) {
      return sendError(
        res,
        "At least 2 valid members required for group chat",
        400
      );
    }

    // Create group chat
    const participants = validMembers.map((memberId: string) => ({
      user: new Types.ObjectId(memberId),
      role: memberId === creatorId.toString() ? "owner" : "member",
      isActive: true,
    }));

    const groupChat = await Chat.create({
      type: "group",
      groupName: name,
      groupDescription: description || "",
      participants,
      groupSettings: {
        whoCanAddMembers: "admins",
        whoCanEditGroupInfo: "admins",
        whoCanSendMessages: "everyone",
      },
      lastActivity: new Date(),
    });

    // Create ChatParticipant entries for all members
    const chatParticipants = validMembers.map((memberId: string) => ({
      chatId: groupChat._id,
      userId: new Types.ObjectId(memberId),
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
    }));

    await ChatParticipant.create(chatParticipants);

    // Populate with user details
    const populatedGroup = await populateChatWithUsers(groupChat, token);

    return sendSuccess(
      res,
      { group: populatedGroup },
      "Group chat created successfully",
      200
    );
  } catch (error) {
    console.error("Error creating group chat:", error);
    return sendError(res, "Failed to create group chat", 500, error);
  }
};

export const getMyGroupChats = async (req: AuthRequest, res: Response) => {
  const userId = req.user._id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  try {
    // Get all chat participants for the user
    const chatParticipants = await ChatParticipant.find({
      userId: userId,
      isArchived: { $ne: true },
    }).sort({ isPinned: -1, updatedAt: -1 });

    // Get chat IDs
    const chatIds = chatParticipants.map((cp) => cp.chatId);

    // Get all group chats
    const chats = await Chat.find({
      _id: { $in: chatIds },
      type: "group",
    });

    // Collect all unique user IDs from all chats
    const allUserIds = new Set<string>();
    chats.forEach((chat) => {
      chat.participants.forEach((p) => {
        if (p.isActive) allUserIds.add(p.user.toString());
      });
    });

    // Fetch all users in batch
    const users = await fetchUserDetails(Array.from(allUserIds), token);
    const userMap = new Map(users.map((u) => [u._id, u]));

    // Map and populate chats
    const groups = chatParticipants
      .map((cp) => {
        const chat = chats.find((c) => c._id == cp.chatId.toString());
        if (!chat) return null;

        // Populate participants
        const populatedParticipants = chat.participants.map((p) => ({
          ...p,
          user: userMap.get(p.user.toString()) || { _id: p.user },
        }));

        return {
          group: {
            ...chat.toObject(),
            participants: populatedParticipants,
          },
          unreadCount: cp.unreadCount,
          isMuted: cp.isMuted,
          isArchived: cp.isArchived,
          isPinned: cp.isPinned,
        };
      })
      .filter(Boolean);

    return sendSuccess(
      res,
      {
        groups,
        count: groups.length,
      },
      "Group chats retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Error getting group chats:", error);
    return sendError(res, "Failed to retrieve group chats", 500, error);
  }
};

export const getGroupChatByChatID = async (req: AuthRequest, res: Response) => {
  const { chatID } = req.params;
  const userId = req.user._id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  if (!Types.ObjectId.isValid(chatID!)) {
    return sendError(res, "Invalid chat ID", 400);
  }

  try {
    const group = await Chat.findOne({
      _id: chatID,
      type: "group",
      "participants.user": userId,
      "participants.isActive": true,
    });

    if (!group) {
      return sendError(res, "Group not found or access denied", 404);
    }

    // Populate with user details
    const populatedGroup = await populateChatWithUsers(group, token);

    const chatParticipant = await ChatParticipant.findOne({
      chatId: chatID,
      userId: userId,
    });

    const responseData = {
      group: populatedGroup,
      userGroupInfo: {
        unreadCount: chatParticipant?.unreadCount || 0,
        isMuted: chatParticipant?.isMuted || false,
        isArchived: chatParticipant?.isArchived || false,
        isPinned: chatParticipant?.isPinned || false,
      },
    };

    return sendSuccess(res, responseData, "Group retrieved successfully", 200);
  } catch (error) {
    console.error("Error getting group chat:", error);
    return sendError(res, "Failed to retrieve group", 500, error);
  }
};

export const editGroupChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const { name, description } = req.body;
  const userId = req.user._id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  if (!Types.ObjectId.isValid(chatID!)) {
    return sendError(res, "Invalid chat ID", 400);
  }

  try {
    const group = await Chat.findOne({
      _id: chatID,
      type: "group",
      "participants.user": userId,
      "participants.isActive": true,
    });

    if (!group) {
      return sendError(res, "Group not found or access denied", 404);
    }

    // Check if user has permission to edit group info
    const userParticipant = group.participants.find(
      (p) => p.user.toString() === userId.toString() && p.isActive
    );

    const canEdit =
      userParticipant &&
      (userParticipant.role === "owner" ||
        userParticipant.role === "admin" ||
        group.groupSettings?.whoCanEditGroupInfo === "everyone");

    if (!canEdit) {
      return sendError(res, "Permission denied to edit group info", 403);
    }

    // Update group info
    const updateData: any = {};
    if (name) updateData.groupName = name;
    if (description !== undefined) updateData.groupDescription = description;

    const updatedGroup = await Chat.findByIdAndUpdate(chatID, updateData, {
      new: true,
    });

    // Populate with user details
    const populatedGroup = await populateChatWithUsers(updatedGroup, token);

    return sendSuccess(
      res,
      { group: populatedGroup },
      "Group updated successfully",
      200
    );
  } catch (error) {
    console.error("Error editing group chat:", error);
    return sendError(res, "Failed to update group", 500, error);
  }
};

export const deleteGroupChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const userId = req.user._id;

  if (!Types.ObjectId.isValid(chatID!)) {
    return sendError(res, "Invalid chat ID", 400);
  }

  try {
    const group = await Chat.findOne({
      _id: chatID,
      type: "group",
      "participants.user": userId,
      "participants.isActive": true,
    });

    if (!group) {
      return sendError(res, "Group not found or access denied", 404);
    }

    const userParticipant = group.participants.find(
      (p) => p.user.toString() === userId.toString() && p.isActive
    );

    // Only owner can delete the entire group
    if (userParticipant?.role === "owner") {
      // Delete entire group
      await Chat.findByIdAndDelete(chatID);
      await ChatParticipant.deleteMany({ chatId: chatID });
      return sendSuccess(res, "Group deleted successfully");
    } else {
      // Regular member leaving the group
      await group.removeParticipant(userId);
      await ChatParticipant.findOneAndUpdate(
        { chatId: chatID, userId: userId },
        { isArchived: true }
      );
      return sendSuccess(res, "Left group successfully");
    }
  } catch (error) {
    console.error("Error deleting group chat:", error);
    return sendError(res, "Failed to delete group", 500, error);
  }
};

export const addMemberInGroupChat = async (req: AuthRequest, res: Response) => {
  const { chatID } = req.params;
  const { userID } = req.body;
  const requesterId = req.user._id;
  const token = req?.cookies?.accessToken || req?.cookies?.refreshToken;

  if (!Types.ObjectId.isValid(chatID!) || !Types.ObjectId.isValid(userID)) {
    return sendError(res, "Invalid chat or user ID", 400);
  }

  try {
    const group = await Chat.findOne({
      _id: chatID,
      type: "group",
      "participants.user": requesterId,
      "participants.isActive": true,
    });

    if (!group) {
      return sendError(res, "Group not found or access denied", 404);
    }

    // Check permissions
    const requesterParticipant = group.participants.find(
      (p) => p.user.toString() === requesterId.toString() && p.isActive
    );

    const canAdd =
      requesterParticipant &&
      (requesterParticipant.role === "owner" ||
        requesterParticipant.role === "admin" ||
        group.groupSettings?.whoCanAddMembers === "everyone");

    if (!canAdd) {
      return sendError(res, "Permission denied to add members", 403);
    }

    // Verify user exists
    const { data } = await axios.get(`${USER_SERVICE}/people/${userID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!data?.data) {
      return sendError(res, "User not found", 404);
    }

    // Add member to group
    const result = await group.addParticipant(
      new Types.ObjectId(userID),
      "member"
    );
    if (!result) {
      return sendError(res, "User is already a member of this group", 400);
    }

    // Create ChatParticipant entry
    await ChatParticipant.create({
      chatId: chatID,
      userId: userID,
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
    });

    return sendSuccess(res, "Member added successfully");
  } catch (error) {
    console.error("Error adding member to group:", error);
    return sendError(res, "Failed to add member", 500, error);
  }
};

export const removeMemberInGroupChat = async (
  req: AuthRequest,
  res: Response
) => {
  const { chatID } = req.params;
  const { userID } = req.body;
  const requesterId = req.user._id;

  if (!Types.ObjectId.isValid(chatID!) || !Types.ObjectId.isValid(userID)) {
    return sendError(res, "Invalid chat or user ID", 400);
  }

  try {
    const group = await Chat.findOne({
      _id: chatID,
      type: "group",
      "participants.user": requesterId,
      "participants.isActive": true,
    });

    if (!group) {
      return sendError(res, "Group not found or access denied", 404);
    }

    // Check permissions
    const requesterParticipant = group.participants.find(
      (p) => p.user.toString() === requesterId.toString() && p.isActive
    );

    const targetParticipant = group.participants.find(
      (p) => p.user.toString() === userID.toString() && p.isActive
    );

    if (!targetParticipant) {
      return sendError(res, "User is not a member of this group", 400);
    }

    // Users can remove themselves, or admins/owners can remove others
    const canRemove =
      requesterId.toString() === userID.toString() ||
      (requesterParticipant &&
        (requesterParticipant.role === "owner" ||
          (requesterParticipant.role === "admin" &&
            targetParticipant.role === "member")));

    if (!canRemove) {
      return sendError(res, "Permission denied to remove this member", 403);
    }

    // Remove member from group
    await group.removeParticipant(new Types.ObjectId(userID));

    // Update ChatParticipant entry
    await ChatParticipant.findOneAndUpdate(
      { chatId: chatID, userId: userID },
      { isArchived: true }
    );

    return sendSuccess(res, "Member removed successfully");
  } catch (error) {
    console.error("Error removing member from group:", error);
    return sendError(res, "Failed to remove member", 500, error);
  }
};
