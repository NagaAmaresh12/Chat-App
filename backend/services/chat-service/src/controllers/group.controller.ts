// src/controllers/group.controller.ts
import { Request, Response } from "express";
import axios from "axios";
import { Types } from "mongoose";
import { Chat } from "../models/chat.model.js";
import { ChatParticipant } from "../models/chat.particitipate.model.js";
import { AppError, isValid, logger, sendError, sendSuccess } from "../utils/index.js";

interface AuthRequest extends Request {
  user?: any;
}

// ----------------- Helpers -----------------

/** Return the first header string if array else value. */
export const getHeaderValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/** Return a Types.ObjectId if valid, else null */
export const safeObjectId = (id: string): Types.ObjectId | null =>
  Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;

const USER_SERVICE = process.env.USERS_SERVICE || "";

/** Fetch user details from user-service for array of ids using provided token */
const fetchUserDetails = async (userIds: string[], token: string) => {
  if (!userIds || userIds.length === 0) return [];

  if (!USER_SERVICE) {
    logger.error("USER_SERVICE not configured");
    return [];
  }

  if (!token) {
    logger.warn("fetchUserDetails called without token");
    return [];
  }

  const requests = userIds.map((u) =>
    axios
      .get(`${USER_SERVICE}/people/${u}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.data?.data)
      .catch((err) => {
        logger.warn("User service fetch failed for userId", { userId: u, err: err?.message || err });
        return null;
      })
  );

  const results = await Promise.all(requests);
  return results.filter(Boolean); // keep non-null entries
};

/** Populate a Chat document's participants with user objects fetched from user service */
const populateChatWithUsers = async (chat: any, token: string) => {
  if (!chat) return chat;

  const participantIds = chat.participants
    .filter((p: any) => p.isActive)
    .map((p: any) => p.user.toString());

  const users = await fetchUserDetails([...new Set(participantIds)] as string[], token);
  const userMap = new Map(users.map((u: any) => [String(u._id), u]));

  // map participants -> include user object (or fallback)
  const populatedParticipants = chat.participants.map((p: any) => {
    const userObj = userMap.get(String(p.user)) || { _id: p.user };
    // If p is a mongoose subdoc, toObject keeps fields consistent
    const base = typeof p.toObject === "function" ? p.toObject() : { ...p };
    return {
      ...base,
      user: userObj,
    };
  });

  const chatObj = typeof chat.toObject === "function" ? chat.toObject() : { ...chat };
  chatObj.participants = populatedParticipants;
  return chatObj;
};

// ----------------- Controllers -----------------

/**
 * Create a new group chat
 */
export const createNewGroupChat = async (req: AuthRequest, res: Response) => {
  const { name, members, description } = req.body;
  const creatorHeader = getHeaderValue(req.headers["x-user-id"]);
  const token = req.cookies?.accessToken || req.cookies?.refreshToken;

  if (!creatorHeader) return sendError(res, "Missing creator ID in headers", 400);
  if (!Array.isArray(members) || members.length === 0) {
    return sendError(res, "Members must be a non-empty array", 400);
  }
  if (!token) return sendError(res, "Authentication token missing", 401);
  if (!USER_SERVICE) return sendError(res, "USER_SERVICE not configured", 500);

  try {
    // ensure creator included and unique
    const normalizedMembers = Array.from(new Set([creatorHeader, ...members.map(String)]));

    // verify each member exists in user-service
    const checkResults = await Promise.all(
      normalizedMembers.map(async (m) => {
        try {
          const { data } = await axios.get(`${USER_SERVICE}/people/${m}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return data?.data ? m : null;
        } catch (err) {
          return null;
        }
      })
    );

    const validMembers = checkResults.filter(Boolean) as string[];
    if (validMembers.length < 2) {
      return sendError(res, "At least 2 valid members required for group chat", 400);
    }

    // create participants list
    const participants = validMembers.map((memberId) => {
      const role = memberId === creatorHeader ? "owner" : "member";
      return {
        user: safeObjectId(memberId)!, // guaranteed valid because user-service returned user
        role,
        isActive: true,
      };
    });

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

    // create ChatParticipant entries
    const chatParticipants = validMembers.map((memberId) => ({
      chatId: groupChat._id,
      userId: safeObjectId(memberId)!,
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
    }));

    await ChatParticipant.insertMany(chatParticipants);

    const populatedGroup = await populateChatWithUsers(groupChat, token);
    return sendSuccess(res, { group: populatedGroup }, "Group chat created successfully", 200);
  } catch (error) {
    logger.error("createNewGroupChat failed", { error });
    return sendError(res, "Failed to create group chat", 500, error);
  }
};

/**
 * Get all group chats for logged-in user
 */
export const getMyGroupChats = async (req: AuthRequest, res: Response) => {
  console.log("Request Comes Here..");
  
  const userHeader = getHeaderValue(req.headers["x-user-id"]);
  const token = req.cookies?.accessToken || req.cookies?.refreshToken;

  if (!userHeader) return sendError(res, "Missing user ID in headers", 400);
  if (!isValid(userHeader)) return sendError(res, "Invalid user ID", 400);
  if (!token) logger.warn("getMyGroupChats: no token provided; user info fetches may fail");

  try {
    // find chatParticipant rows for this user
    const chatParticipants = await ChatParticipant.find({
      userId: safeObjectId(userHeader)!,
      isArchived: { $ne: true },
    }).sort({ isPinned: -1, updatedAt: -1 });

    const chatIds = chatParticipants.map((cp) => cp.chatId);

    if (!chatIds.length) {
      return sendSuccess(res, { groups: [], count: 0 }, "Group chats retrieved successfully", 200);
    }

    // fetch chats
    const chats = await Chat.find({
      _id: { $in: chatIds },
      type: "group",
      "participants.isActive": true,
    });

    // collect unique user ids
    const allUserIds = new Set<string>();
    chats.forEach((c: any) => {
      (c.participants || []).forEach((p: any) => {
        if (p.isActive) allUserIds.add(String(p.user));
      });
    });

    const users = await fetchUserDetails(Array.from(allUserIds), token);
    const userMap = new Map((users || []).map((u: any) => [String(u._id), u]));

    // assemble groups list
    const groups = chatParticipants
      .map((cp) => {
        const chat = chats.find((c) => String(c._id) === String(cp.chatId));
        if (!chat) return null;

        const populatedParticipants = chat.participants.map((p: any) => ({
          ...(p.toObject ? p.toObject() : p),
          user: userMap.get(String(p.user)) || { _id: p.user },
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

    return sendSuccess(res, { groups, count: groups.length }, "Group chats retrieved successfully", 200);
  } catch (error) {
    logger.error("getMyGroupChats failed", { error });
    return sendError(res, "Failed to retrieve group chats", 500, error);
  }
};

/**
 * Get a specific group chat by chatID (must be participant)
 */
export const getGroupChatByChatID = async (req: AuthRequest, res: Response) => {
  const { chatID } = req.params;
  const userHeader = getHeaderValue(req.headers["x-user-id"]);
  const token = req.cookies?.accessToken || req.cookies?.refreshToken;

  if (!userHeader) return sendError(res, "Missing user ID in headers", 400);
  if (!chatID || !Types.ObjectId.isValid(chatID)) return sendError(res, "Invalid chat ID", 400);

  try {
    const group = await Chat.findOne({
      _id: chatID,
      type: "group",
      "participants.user": safeObjectId(userHeader),
      "participants.isActive": true,
    });

    if (!group) return sendError(res, "Group not found or access denied", 404);

    const populatedGroup = await populateChatWithUsers(group, token);

    const chatParticipant = await ChatParticipant.findOne({
      chatId: safeObjectId(chatID)!,
      userId: safeObjectId(userHeader)!,
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
    logger.error("getGroupChatByChatID failed", { error });
    return sendError(res, "Failed to retrieve group", 500, error);
  }
};

/**
 * Edit group chat settings (group-level fields)
 * 🔧 FIX: Separate user-specific settings from group settings
 */
export const editGroupChatByChatID = async (req: AuthRequest, res: Response) => {
  const { chatID } = req.params;
  const { name, description, isPinned, isMuted, isArchived, groupSettings, isBlocked } = req.body ?? {};

  const headerUser = getHeaderValue(req.headers["x-user-id"]);
  const userId = headerUser || (req.user && (req.user.id || req.user.userId));
  const token = req.cookies?.accessToken || req.cookies?.refreshToken;

  if (!userId) return sendError(res, "Missing user id", 400);
  if (!chatID || !Types.ObjectId.isValid(chatID)) return sendError(res, "Invalid chat ID", 400);

  try {
    // ✅ Find group
    const group = await Chat.findOne({
      _id: chatID,
      type: "group",
      "participants.user": safeObjectId(userId),
      "participants.isActive": true,
    });
    if (!group) return sendError(res, "Group not found or access denied", 404);

    // ✅ Check permissions
    const userParticipant = group.participants.find(
      (p: any) => String(p.user) === String(userId) && p.isActive
    );
    const canEdit =
      !!userParticipant &&
      (userParticipant.role === "owner" ||
        userParticipant.role === "admin" ||
        group.groupSettings?.whoCanEditGroupInfo === "everyone");
    if (!canEdit) return sendError(res, "Permission denied", 403);

    const updateData: Record<string, any> = {};

    // ✅ Group-level edits
    if (typeof name === "string" && name.trim()) updateData.groupName = name.trim();
    if (typeof description === "string") updateData.groupDescription = description.trim();
    if (groupSettings && typeof groupSettings === "object") {
      updateData.groupSettings = { ...group.groupSettings, ...groupSettings };
    }

    // ✅ Save group changes if any
    if (Object.keys(updateData).length > 0) {
      Object.assign(group, updateData);
      await group.save();
    }

    // ✅ Handle per-user preferences in ChatParticipant
    if (typeof isArchived === "boolean" || typeof isMuted === "boolean" || typeof isPinned === "boolean" || typeof isBlocked === "boolean") {
      await ChatParticipant.updateOne(
        { chatId: chatID, userId },
        {
          ...(typeof isArchived === "boolean" && { isArchived }),
          ...(typeof isMuted === "boolean" && { isMuted }),
          ...(typeof isPinned === "boolean" && { isPinned, pinnedAt: isPinned ? new Date() : null }),
          ...(typeof isBlocked === "boolean" && { isBlocked }), // ✅ add this
        }
      );
    }

    const populatedGroup = await populateChatWithUsers(group, token);
    return sendSuccess(res, { group: populatedGroup }, "Group updated successfully", 200);
  } catch (error) {
    logger.error("editGroupChatByChatID failed", { error });
    return sendError(res, "Failed to update group", 500, error);
  }
};

/**
 * 🆕 NEW: Update user-specific group settings (mute, pin, archive)
 */
export const updateUserGroupSettings = async (req: AuthRequest, res: Response) => {
  const { chatID } = req.params;
  const { isMuted, isPinned, isArchived } = req.body;

  const userHeader = getHeaderValue(req.headers["x-user-id"]);

  if (!userHeader) return sendError(res, "Missing user ID in headers", 400);
  if (!chatID || !Types.ObjectId.isValid(chatID)) return sendError(res, "Invalid chat ID", 400);

  try {
    // Verify user is participant
    const group = await Chat.findOne({
      _id: chatID,
      type: "group",
      "participants.user": safeObjectId(userHeader),
      "participants.isActive": true,
    });

    if (!group) return sendError(res, "Group not found or access denied", 404);

    // Update ChatParticipant (user-specific settings)
    const updateData: any = {};
    if (typeof isMuted === "boolean") updateData.isMuted = isMuted;
    if (typeof isPinned === "boolean") updateData.isPinned = isPinned;
    if (typeof isArchived === "boolean") updateData.isArchived = isArchived;

    const updatedChatParticipant = await ChatParticipant.findOneAndUpdate(
      { chatId: safeObjectId(chatID)!, userId: safeObjectId(userHeader)! },
      updateData,
      { new: true }
    );

    if (!updatedChatParticipant) {
      return sendError(res, "ChatParticipant record not found", 404);
    }

    return sendSuccess(
      res,
      { userGroupInfo: updatedChatParticipant },
      "User group settings updated successfully",
      200
    );
  } catch (error) {
    logger.error("updateUserGroupSettings failed", { error });
    return sendError(res, "Failed to update user group settings", 500, error);
  }
};

/**
 * Delete (leave) group or delete group entirely (owner)
 */
export const deleteGroupChatByChatID = async (req: AuthRequest, res: Response) => {
  const { chatID } = req.params;
  const userHeader = getHeaderValue(req.headers["x-user-id"]);

  if (!userHeader) return sendError(res, "Missing user ID in headers", 400);
  if (!chatID || !Types.ObjectId.isValid(chatID)) return sendError(res, "Invalid chat ID", 400);

  try {
    const group = await Chat.findOne({
      _id: chatID,
      type: "group",
      "participants.user": safeObjectId(userHeader),
      "participants.isActive": true,
    });

    if (!group) return sendError(res, "Group not found or access denied", 404);

    const userParticipant = group.participants.find(
      (p: any) => String(p.user) === String(userHeader) && p.isActive
    );

    if (!userParticipant) return sendError(res, "Not a group participant", 403);

    // Owner deletes entire group
    if (userParticipant.role === "owner") {
      await Chat.findByIdAndDelete(chatID);
      await ChatParticipant.deleteMany({ chatId: safeObjectId(chatID)! });
      return sendSuccess(res, null, "Group deleted successfully");
    }

    // Otherwise user leaves group (soft remove)
    await group.removeParticipant(safeObjectId(userHeader)!);
    // ensure persistence if removeParticipant didn't save internally
    if (typeof group.save === "function") await group.save();

    await ChatParticipant.findOneAndUpdate(
      { chatId: safeObjectId(chatID)!, userId: safeObjectId(userHeader)! },
      { isArchived: true }
    );

    return sendSuccess(res, null, "Left group successfully");
  } catch (error) {
    logger.error("deleteGroupChatByChatID failed", { error });
    return sendError(res, "Failed to delete group", 500, error);
  }
};

/**
 * Add multiple members to group chat
 */
export const addMemberInGroupChat = async (req: AuthRequest, res: Response) => {
  const { chatID } = req.params;
  const { userIDs }: { userIDs: string[] } = req.body;
  const requesterHeader = getHeaderValue(req.headers["x-user-id"]);
  const token = req.cookies?.accessToken || req.cookies?.refreshToken;

  if (!requesterHeader) return sendError(res, "Missing requester ID in headers", 400);
  if (!Array.isArray(userIDs) || userIDs.length === 0) return sendError(res, "userIDs required", 400);
  if (!chatID || !Types.ObjectId.isValid(chatID)) return sendError(res, "Invalid chat ID", 400);
  if (!userIDs.every((id) => Types.ObjectId.isValid(id))) return sendError(res, "Invalid user IDs provided", 400);
  if (!token) return sendError(res, "Authentication token missing", 401);

  try {
    const group = await Chat.findOne({
      _id: safeObjectId(chatID),
      type: "group",
      "participants.user": safeObjectId(requesterHeader),
      "participants.isActive": true,
    });

    if (!group) return sendError(res, "Group not found or access denied", 404);

    const requesterParticipant = group.participants.find(
      (p: any) => String(p.user) === String(requesterHeader) && p.isActive
    );

    const canAdd =
      !!requesterParticipant &&
      (requesterParticipant.role === "owner" ||
        requesterParticipant.role === "admin" ||
        group.groupSettings?.whoCanAddMembers === "everyone");

    if (!canAdd) return sendError(res, "Permission denied to add members", 403);

    const existingIds = new Set(group.participants.map((p: any) => String(p.user)));

    const notFoundUsers: string[] = [];
    const alreadyMembers: string[] = [];
    const toAddUnique: string[] = [];

    // Validate users and filter out duplicates
    await Promise.all(
      userIDs.map(async (userID) => {
        if (existingIds.has(userID)) {
          alreadyMembers.push(userID);
          return;
        }
        try {
          const { data } = await axios.get(`${USER_SERVICE}/people/${userID}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!data?.data) {
            notFoundUsers.push(userID);
            return;
          }
          toAddUnique.push(userID);
        } catch (err) {
          notFoundUsers.push(userID);
        }
      })
    );

    if (toAddUnique.length === 0) {
      return sendSuccess(
        res,
        { message: "No new users to add", alreadyMembers, notFoundUsers },
        "No users added",
        200
      );
    }

    // Add participants to chat document
    toAddUnique.forEach((id) => {
      const objectId = safeObjectId(id);
      if (!objectId) return; // Skip if invalid
      
      group.participants.push({
        user: objectId,
        role: "member",
        isActive: true,
      });
    });

    // persist chat
    await group.save();

    // Create ChatParticipant entries
    const chatParticipantDocs = toAddUnique.map((id) => ({
      chatId: group._id,
      userId: safeObjectId(id)!,
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
    }));

    await ChatParticipant.insertMany(chatParticipantDocs);

    return sendSuccess(
      res,
      {
        addedCount: toAddUnique.length,
        alreadyMembers,
        notFoundUsers,
      },
      `Added ${toAddUnique.length} member(s) successfully`,
      200
    );
  } catch (error) {
    logger.error("addMemberInGroupChat failed", { error });
    return sendError(res, "Failed to add members", 500, error);
  }
};

/**
 * Remove members from group chat (multiple)
 */
export const removeMemberInGroupChat = async (req: AuthRequest, res: Response) => {
  const { chatID } = req.params;
  const { userIDs }: { userIDs: string[] } = req.body;
  const requesterHeader = getHeaderValue(req.headers["x-user-id"]);

  if (!requesterHeader) return sendError(res, "Missing requester ID in headers", 400);
  if (!Array.isArray(userIDs) || userIDs.length === 0) return sendError(res, "userIDs required", 400);
  if (!chatID || !Types.ObjectId.isValid(chatID)) return sendError(res, "Invalid chat ID", 400);
  if (!userIDs.every((id) => Types.ObjectId.isValid(id))) return sendError(res, "Invalid user IDs", 400);

  try {
    const group = await Chat.findOne({
      _id: safeObjectId(chatID),
      type: "group",
      "participants.user": safeObjectId(requesterHeader),
      "participants.isActive": true,
    });

    if (!group) return sendError(res, "Group not found or access denied", 404);

    const requesterParticipant = group.participants.find(
      (p: any) => String(p.user) === String(requesterHeader) && p.isActive
    );

    if (!requesterParticipant) return sendError(res, "Requester not a member", 403);

    const notMembers: string[] = [];
    const permissionDenied: string[] = [];
    const removed: string[] = [];

    // protecting owner: get owner id
    const ownerParticipant = group.participants.find((p: any) => p.role === "owner");
    const ownerId = ownerParticipant ? String(ownerParticipant.user) : null;

    for (const userID of userIDs) {
      const targetParticipant = group.participants.find((p: any) => String(p.user) === String(userID) && p.isActive);
      if (!targetParticipant) {
        notMembers.push(userID);
        continue;
      }

      // cannot remove owner via this API
      if (ownerId && String(userID) === ownerId) {
        permissionDenied.push(userID);
        continue;
      }

      const canRemove =
        String(requesterHeader) === String(userID) ||
        (requesterParticipant && (requesterParticipant.role === "owner" || requesterParticipant.role === "admin"));

      if (!canRemove) {
        permissionDenied.push(userID);
        continue;
      }

      // perform removal
      await group.removeParticipant(safeObjectId(userID)!);
      removed.push(userID);

      // archive ChatParticipant entry
      await ChatParticipant.findOneAndUpdate(
        { chatId: safeObjectId(chatID)!, userId: safeObjectId(userID)! },
        { isArchived: true }
      );
    }

    // ensure persistence
    if (typeof group.save === "function") await group.save();

    return sendSuccess(
      res,
      {
        removedCount: removed.length,
        notMembers,
        permissionDenied,
      },
      `Removed ${removed.length} member(s) successfully`,
      200
    );
  } catch (error) {
    logger.error("removeMemberInGroupChat failed", { error });
    return sendError(res, "Failed to remove members", 500, error);
  }
};