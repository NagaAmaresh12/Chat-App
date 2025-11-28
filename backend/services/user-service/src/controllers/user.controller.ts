import { IUser, User } from "../models/user.model.js";
import { Request, Response } from "express";
import { AuthRequest } from "../controllers/auth.controller.js";
import { isValid } from "../utils/validation.js";
import { sendError, sendSuccess } from "../utils/response.js";

import type { Schema } from "mongoose";
import mongoose from "mongoose";

interface IUserSemi {
  _id: Schema.Types.ObjectId | string;
  email: string;
  username: string;
  displayname: string;
  bio?: string;
  isOnline: boolean;
  avatar?: string;
  blockedUsers?: Schema.Types.ObjectId[] | null;
  favourite?: string;
  settings?: {
    privacy: {
      lastSeen: string;
      profilePhoto: string;
      status: string;
    };
    notifications: {
      messageNotifications: boolean;
      groupNotifications: boolean;
      sound: boolean;
    };
    theme: string;
  };
}

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Extract pagination params from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // ✅ Fetch users with pagination
    const users = await User.find({}, "_id username email bio isOnline avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional, newest first

    // ✅ Total count
    const total = await User.countDocuments();

    // ✅ Pagination meta
    const hasMore = page * limit < total;

    // ✅ Sanitize user data
    const safeUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      isOnline: user.isOnline,
      avatar: user.avatar || null,
    }));

    // ✅ Token refresh logic should happen in middleware
    // Here, only reuse tokens if middleware attached them
    if (req?.accessToken && req?.refreshToken) {
      res.cookie("accessToken", req.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", req.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // ✅ Send paginated response
    return sendSuccess(
      res,
      {
        users: safeUsers,
        total,
        page,
        limit,
        hasMore,
      },
      "Fetched Users Successfully",
      200
    );
  } catch (error: any) {
    console.error("❌ getAllUsers error:", error.message);
    return sendError(res, "Failed to fetch users", 500, error.message);
  }
};
export const getAllUsersPage = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Fetch users with pagination
    const [users, totalUsers] = await Promise.all([
      User.find({}, "_id username email bio isOnline")
        .sort({ isOnline: -1, lastSeen: -1 }) // online users first
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);
    const safeUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      isOnline: user.isOnline,
      avatar: user.avatar || "",
    }));

    // ✅ Handle token refresh cookies (same logic you had before)
    if (req?.accessToken && req?.refreshToken) {
      // Clear both cookies
      res.clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // ✅ important
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // ✅ must match path of original cookie
      });

      // Optionally re-set new cookies if needed
      res.cookie("accessToken", req?.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // ✅ add this to make future clears predictable
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", req?.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // ✅ consistent path
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return sendSuccess(
      res,
      {
        users: safeUsers,
        page,
        limit,
        total: totalUsers,
        hasMore: page * limit < totalUsers,
        remaining: Math.max(totalUsers - page * limit),
        totalPages: Math.ceil(totalUsers / limit),
      },
      "Fetched users successfully",
      200
    );
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    return sendError(res, "Failed to fetch users", 500, error.message);
  }
};

export const getUserByID = async (req: AuthRequest, res: Response) => {
  console.log("Gettin user by ID...");
  let token = req?.headers?.authorization;
  console.log("====================================");
  console.log({ token });
  console.log("====================================");
  const { userID } = req.params;
  console.log({ userID, token: req?.headers.authorization });

  if (!isValid(userID!)) {
    return sendError(res, "UserID is Not Valid.", 400);
  }
  const user = await User.findById(userID);
  if (!user) {
    sendError(res, "User Does Not Exists", 400);
  }

  const userData: IUserSemi = {
    _id: user?._id as string | Schema.Types.ObjectId,
    username: user?.username!,

    email: user?.email!,
    bio: user?.bio ?? "",
    avatar: user?.avatar ?? "",
    displayname: user?.displayName || "",
    isOnline: user?.isOnline!,
    blockedUsers: user?.blockedUsers,
    settings: user?.settings as {
      privacy: {
        lastSeen: string;
        profilePhoto: string;
        status: string;
      };
      notifications: {
        messageNotifications: boolean;
        groupNotifications: boolean;
        sound: boolean;
      };
      theme: string;
    },
  };
  console.log({ userData });

  sendSuccess(res, userData, "Fetched user Successfully", 200);
};

export const getUsersByBatch = async (req: AuthRequest, res: Response) => {
  try {
    const userIDs = req.body;
    console.log({
      body: req.body,
      userIDs,
    });

    // Validate input
    if (!Array.isArray(userIDs) || userIDs.length === 0) {
      return sendError(res, "userIDs must be a non-empty array.", 400);
    }

    // Filter only valid ObjectIds
    const validUserIDs = userIDs.filter((id: string) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validUserIDs.length === 0) {
      return sendError(res, "No valid user IDs provided.", 400);
    }

    // Query the users
    const users = await User.find(
      { _id: { $in: validUserIDs } },
      "username displayName avatar email" // select only the needed fields
    );
    console.log(
      "these two tokens will be exists only if accesstoken is expired, these tokens are from req?.accessToken and req?.refreshToken",
      {
        accessToken: req?.accessToken,
        refreshToken: req?.refreshToken,
      }
    );
    const safeUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      isOnline: user.isOnline,
      avatar: user.avatar,
    }));

    if (req?.accessToken && req?.refreshToken) {
      console.log(
        "since new tokens generated and received from req. and setting both token in cookies in res"
      );
      // Clear both cookies
      res.clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // ✅ important
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // ✅ must match path of original cookie
      });

      // Optionally re-set new cookies if needed
      res.cookie("accessToken", req?.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // ✅ add this to make future clears predictable
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", req?.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", // ✅ consistent path
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    return res.status(200).json({
      status: "success",
      count: users.length,
      users: safeUsers,
    });
  } catch (error: any) {
    console.error("Error in getUsersByBatch:", error.message);
    return sendError(res, "Something went wrong while fetching users.", 500);
  }
};
// PATCH /edit/:userID
export const updateUserByID = async (req: AuthRequest, res: Response) => {
  const { userID } = req.params;

  // Validate userID
  if (!isValid(userID!)) return sendError(res, "Invalid UserId", 400);

  try {
    // Find user
    const user = await User.findById(userID);
    if (!user) return sendError(res, "User does not exist", 404);

    // Update only fields that exist in req.body
    const updatableFields: Partial<IUser> = {};
    if (req.body.username) updatableFields.username = req.body.username;
    if (req.body.email) updatableFields.email = req.body.email;
    if (req.body.bio !== undefined || req.body.bio !== "")
      updatableFields.bio = req.body.bio;
    if (req.body.avatar) updatableFields.avatar = req.body.avatar;

    Object.assign(user, updatableFields);

    await user.save();

    // Create a sanitized object
    const safeUsers = {
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      isOnline: user.isOnline,
      // lastSeen: user.lastSeen,
      // displayName: user.displayName,
    };

    // Return as `users` in response
    return sendSuccess(
      res,
      { users: safeUsers },
      "User updated successfully",
      200
    );
  } catch (error: any) {
    console.error("Error updating user:", error.message);
    return sendError(res, "Internal server error", 500, error.message);
  }
};
