import { Schema, Document, model } from "mongoose";
const notificationSchema = new Schema(
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
    title: String,
    body: String,
    data: {
      chatId: {
        type: Schema.Types.ObjectId,
        ref: "Chat",
      },
      messageId: {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
      fromUserId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
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
    deviceTokens: [String],
    sentAt: Date,
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for Notification model
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
const Notification = model("Notification", notificationSchema);
