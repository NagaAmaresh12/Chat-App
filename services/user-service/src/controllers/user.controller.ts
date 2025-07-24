import { User } from "../models/user.model.js";
import { Request, Response } from "express";
import { AuthRequest } from "../controllers/auth.controller.js";
import { isValid } from "../utils/validation.js";
import { sendError, sendSuccess } from "../utils/response.js";
// import type { IUser } from "../models/user.model.js";
import type { Schema } from "mongoose";

interface IUserSemi {
  _id: Schema.Types.ObjectId | string;
  email: string;
  username: string;
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
  const { id, email } = req.user;
  if (!isValid(id) || !isValid(email)) {
    return sendError(res, "User is Not Authenticated.", 400);
  }
  const user = await User.findById(id);
  if (!user) {
    sendError(res, "User Does Not Exists", 400);
  }
  const userData: IUserSemi = {
    _id: user?._id as string | Schema.Types.ObjectId,
    username: user?.username!,
    email: user?.email!,
    bio: user?.bio ?? "",
    avatar: user?.avatar ?? "",
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
  sendSuccess(res, userData, "Fetched user Successfully", 200);
};
export const updateUserByID = async (req: AuthRequest, res: Response) => {
  const { userID } = req.params;
  const { name, bio, profilePhoto } = req.body;

  if (!isValid(userID!)) {
    sendError(res, "Invalid UserId", 400);
  }
  const user = await User.findById(userID);
  if (!user) {
    sendError(res, "User Does not Exists", 400);
  }
  user && (user.username = name ? name : user?.username);
  user && (user.bio = bio ? bio : user?.bio);
  user &&
    (user.settings.privacy.profilePhoto = profilePhoto
      ? profilePhoto
      : user?.settings.privacy.profilePhoto);

  await user?.save();

  sendSuccess(res, user, "Edited User Details Successfully", 200);
};
