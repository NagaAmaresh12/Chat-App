import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "message"
  | "group_invite"
  | "contact_request"
  | "system";

export type DeliveryStatus = "pending" | "sent" | "failed";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title?: string;
  body?: string;
  data?: {
    chatId?: Types.ObjectId;
    messageId?: Types.ObjectId;
    fromUserId?: Types.ObjectId;
  };
  isRead: boolean;
  deliveryStatus: DeliveryStatus;
  deviceTokens?: string[];
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["message", "group_invite", "contact_request", "system"],
      required: true,
    },
    title: { type: String },
    body: { type: String },
    data: {
      chatId: { type: Schema.Types.ObjectId, ref: "Chat" },
      messageId: { type: Schema.Types.ObjectId, ref: "Message" },
      fromUserId: { type: Schema.Types.ObjectId, ref: "User" },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    deviceTokens: [{ type: String }],
    sentAt: { type: Date },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = model<INotification>(
  "Notification",
  notificationSchema
);
