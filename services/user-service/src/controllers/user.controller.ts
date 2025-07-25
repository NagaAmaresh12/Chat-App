import { User } from "../models/user.model.js";
import { Request, Response } from "express";
import { AuthRequest } from "../controllers/auth.controller.js";
import { isValid } from "../utils/validation.js";
import { sendError, sendSuccess } from "../utils/response.js";
// import type { IUser } from "../models/user.model.js";
import type { Schema } from "mongoose";
import mongoose from "mongoose";
//   {
//   "data": {
//     "_id": "userId123",
//     "username": "john_doe",
//     "displayName": "John Doe",
//     "avatar": "https://example.com/avatar.jpg",
//     "isOnline": true,
//     "lastSeen": "2024-01-20T10:30:00Z"
//   }
// }
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
    const users = await User.find({}, "_id username email bio isOnline");

    // const allUsers: IUserSemi[] = users.map((user) => ({
    //   _id: user?._id as string,
    //   email: user?.email,
    //   username: user?.username,
    //   bio: user?.bio,
    //   isOnline: user?.isOnline,
    // }));
    console.log({
      users,
    });

    sendSuccess(res, users, "Fetched All Users Successfully", 200);
  } catch (error) {
    sendError(res, "Failed to Fetch All Users", 500, error);
  }
};
export const getUserByID = async (req: AuthRequest, res: Response) => {
  console.log("Gettin user by ID...");

  const { userID } = req.params;
  console.log({ userID });

  if (!isValid(userID!)) {
    return sendError(res, "UserID is Not Valid.", 400);
  }
  const user = await User.findById(userID);
  if (!user) {
    sendError(res, "User Does Not Exists", 400);
  }
  //expected output
  //   {
  //   "data": {
  //     "_id": "userId123",
  //     "username": "john_doe",
  //     "displayName": "John Doe",
  //     "avatar": "https://example.com/avatar.jpg",
  //     "isOnline": true,
  //     "lastSeen": "2024-01-20T10:30:00Z"
  //   }
  // }
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

    return res.status(200).json({
      status: "success",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error in getUsersByBatch:", error);
    return sendError(res, "Something went wrong while fetching users.", 500);
  }
};
export const updateUserByID = async (req: AuthRequest, res: Response) => {
  const { userID } = req.params;
  const { username, bio, profilePhoto } = req.body;

  if (!isValid(userID!)) {
    sendError(res, "Invalid UserId", 400);
  }
  const user = await User.findById(userID);
  if (!user) {
    sendError(res, "User Does not Exists", 400);
  }
  user && (user.username = username ? username : user?.username);
  user && (user.bio = bio ? bio : user?.bio);
  user &&
    (user.settings.privacy.profilePhoto = profilePhoto
      ? profilePhoto
      : user?.settings.privacy.profilePhoto);

  await user?.save();

  sendSuccess(res, user, "Edited User Details Successfully", 200);
};
