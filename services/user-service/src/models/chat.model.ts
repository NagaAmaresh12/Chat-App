import { Schema, Document, model } from "mongoose";
const chatSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
      index: true,
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
    // Group specific fields
    groupName: {
      type: String,
      maxlength: 100,
      required: function () {
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
  {
    timestamps: true,
  }
);

// Indexes for Chat model
chatSchema.index({ "participants.user": 1, type: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ type: 1, lastActivity: -1 });
chatSchema.index({ "participants.user": 1, "participants.isActive": 1 });

// Chat Methods
chatSchema.methods.addParticipant = function (userId, role = "member") {
  const existingParticipant = this.participants.find(
    (p) => p.user.toString() === userId.toString() && p.isActive
  );

  if (existingParticipant) {
    return false; // User already in chat
  }

  this.participants.push({
    user: userId,
    role: role,
  });

  return this.save();
};

chatSchema.methods.removeParticipant = function (userId) {
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString() && p.isActive
  );

  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }

  return this.save();
};
const Chat = mongoose.model("Chat", chatSchema);
