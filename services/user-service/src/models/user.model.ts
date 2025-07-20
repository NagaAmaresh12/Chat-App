import { Schema, Document, model } from "mongoose";
import { sign, verify } from "jsonwebtoken";
import { compare } from "bcrypt";

// ==================== USER SCHEMA ====================
const userSchema = new Schema(
  {
    email: {
      type: String,
      require: true,
      index: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      trim: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      minlength: 2,
      unique: true,
      maxlength: 50,
      index: true,
      trim: true,
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
      type: String, // URL to profile picture
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

    refreshTokens: {
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

// Indexes for User model
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1, lastSeen: -1 });
userSchema.index({ "favourite.user": 1 });
userSchema.index({ createdAt: -1 });

// User Methods
userSchema.methods.generateTokens = function () {
  const user = this;

  // Generate Access Token (15 minutes)
  const accessToken = sign(
    {
      userId: user._id,
      phoneNumber: user.phoneNumber,
      username: user.username,
    },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" }
  );

  // Generate Refresh Token (7 days)
  const refreshToken = sign(
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
    accessTokenExpiresIn: 15 * 60 * 1000, // 15 minutes in milliseconds
    refreshTokenExpiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };
};

userSchema.methods.updateOnlineStatus = function (isOnline: boolean) {
  this.isOnline = isOnline;
  this.lastSeen = new Date();
  return this.save();
};

const User = model("User", userSchema);
