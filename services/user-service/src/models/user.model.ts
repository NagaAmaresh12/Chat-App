import { Schema, model, Document, Model } from "mongoose";
import jwt from "jsonwebtoken";

// ==================== INTERFACES ====================

interface FavouriteUser {
  user: Schema.Types.ObjectId;
  addedAt: Date;
  nickname?: string;
}

interface PrivacySettings {
  lastSeen: "everyone" | "favourite" | "nobody";
  profilePhoto: "everyone" | "favourite" | "nobody";
  status: "everyone" | "favourite" | "nobody";
}

interface NotificationSettings {
  messageNotifications: boolean;
  groupNotifications: boolean;
  sound: boolean;
}

interface UserSettings {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  theme: "light" | "dark" | "system";
}

interface RefreshToken {
  token: string;
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  isVerified: boolean;
  blockedUsers: Schema.Types.ObjectId[];
  favourite: FavouriteUser[];
  settings: UserSettings;
  refreshToken: RefreshToken;

  generateTokens(): {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
  };

  updateOnlineStatus(isOnline: boolean): Promise<IUser>;
}

// ==================== SCHEMA ====================

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      trim: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
      trim: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      maxlength: 100,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    favourite: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        nickname: String,
      },
    ],
    settings: {
      privacy: {
        lastSeen: {
          type: String,
          enum: ["everyone", "favourite", "nobody"],
          default: "everyone",
        },
        profilePhoto: {
          type: String,
          enum: ["everyone", "favourite", "nobody"],
          default: "everyone",
        },
        status: {
          type: String,
          enum: ["everyone", "favourite", "nobody"],
          default: "everyone",
        },
      },
      notifications: {
        messageNotifications: {
          type: Boolean,
          default: true,
        },
        groupNotifications: {
          type: Boolean,
          default: true,
        },
        sound: {
          type: Boolean,
          default: true,
        },
      },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
    },
    refreshToken: {
      token: String,
      createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800, // 7 days in seconds
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================

userSchema.index({ isOnline: 1, lastSeen: -1 });
userSchema.index({ "favourite.user": 1 });
userSchema.index({ createdAt: -1 });

// ==================== METHODS ====================
userSchema.methods.generateTokens = function () {
  const user = this;

  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    {
      userId: user._id,
      tokenType: "refresh",
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: 15 * 60 * 1000,
    refreshTokenExpiresIn: 7 * 24 * 60 * 60 * 1000,
  };
};

userSchema.methods.updateOnlineStatus = function (isOnline: boolean) {
  this.isOnline = isOnline;
  this.lastSeen = new Date();
  return this.save();
};

// ==================== MODEL ====================
export const User: Model<IUser> = model<IUser>("User", userSchema);
