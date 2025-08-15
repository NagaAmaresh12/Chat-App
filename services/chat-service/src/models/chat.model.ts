import mongoose, { Schema, Document, Model, Types } from "mongoose";

// Participant sub-document interface
interface Participant {
  user: Types.ObjectId;
  role: "member" | "admin" | "owner";
  joinedAt?: Date;
  leftAt?: Date;
  isActive?: boolean;
}

// Group settings interface
interface GroupSettings {
  whoCanAddMembers: "everyone" | "admins";
  whoCanEditGroupInfo: "everyone" | "admins";
  whoCanSendMessages: "everyone" | "admins";
}

// Pinned user info
interface PinnedUser {
  user: Types.ObjectId;
  pinnedAt?: Date;
}

// Main Chat Document interface
export interface IChat extends Document {
  type: "private" | "group";
  participants: Participant[];
  groupName?: string;
  groupDescription?: string;
  groupAvatar?: string;
  groupSettings?: GroupSettings;
  lastMessage?: Types.ObjectId;
  lastActivity?: Date;
  isArchived?: boolean;
  isPinned?: PinnedUser[];

  addParticipant(
    userId: Types.ObjectId,
    role?: Participant["role"]
  ): Promise<IChat | false>;
  removeParticipant(userId: Types.ObjectId): Promise<IChat>;
}

// Schema Definition
const chatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      index: true,
      default: "private",
    },
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["member", "admin", "owner"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        leftAt: Date,
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    groupName: {
      type: String,
      maxlength: 100,
      required: function (this: IChat) {
        return this.type === "group";
      },
    },
    groupDescription: {
      type: String,
      maxlength: 500,
    },
    groupAvatar: String,
    groupSettings: {
      whoCanAddMembers: {
        type: String,
        enum: ["everyone", "admins"],
        default: "admins",
      },
      whoCanEditGroupInfo: {
        type: String,
        enum: ["everyone", "admins"],
        default: "admins",
      },
      whoCanSendMessages: {
        type: String,
        enum: ["everyone", "admins"],
        default: "everyone",
      },
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPinned: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        pinnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
chatSchema.index({ "participants.user": 1, type: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ type: 1, lastActivity: -1 });
chatSchema.index({ "participants.user": 1, "participants.isActive": 1 });

// Chat Methods
chatSchema.methods.addParticipant = async function (
  this: IChat,
  userId: Types.ObjectId,
  role: Participant["role"] = "member"
): Promise<IChat | false> {
  const existing = this.participants.find(
    (p) => p.user.toString() === userId.toString() && p.isActive
  );

  if (existing) return false;

  this.participants.push({
    user: userId,
    role,
  });

  return await this.save();
};

chatSchema.methods.removeParticipant = async function (
  this: IChat,
  userId: Types.ObjectId
): Promise<IChat> {
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString() && p.isActive
  );

  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }

  return await this.save();
};

// Export model
const Chat: Model<IChat> = mongoose.model<IChat>("Chat", chatSchema);
export { Document, Chat };
