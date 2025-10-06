import { Schema, Document, model, Types } from "mongoose";

export interface IChatParticipant extends Document {
  chatId: Types.ObjectId;
  userId: Types.ObjectId;
  unreadCount?: number;
  lastReadMessageId?: Types.ObjectId;
  isMuted?: boolean;
  muteUntil?: Date;
  isArchived?: boolean;
  isBlocked?: boolean;
  isPinned?: boolean;
  pinnedAt?: Date;
  customNotificationSound?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatParticipantSchema = new Schema<IChatParticipant>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    muteUntil: Date,
    isArchived: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: Date,
    customNotificationSound: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
chatParticipantSchema.index({ chatId: 1, userId: 1 }, { unique: true });
chatParticipantSchema.index({ userId: 1, unreadCount: 1 });
chatParticipantSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

export const ChatParticipant = model<IChatParticipant>(
  "ChatParticipant",
  chatParticipantSchema
);
