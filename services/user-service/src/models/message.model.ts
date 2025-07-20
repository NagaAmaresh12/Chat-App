import { Schema, Document, model } from "mongoose";
const messageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: [
        "text",
        "image",
        "video",
        "audio",
        "document",
        "location",
        "contact",
      ],
      default: "text",
      index: true,
    },
    content: {
      text: String,
      media: {
        url: String,
        filename: String,
        size: Number,
        mimeType: String,
        duration: Number, // for audio/video
        thumbnail: String, // for video/image
        dimensions: {
          width: Number,
          height: Number,
        },
      },
      //   location: {
      //     latitude: Number,
      //     longitude: Number,
      //     address: String,
      //   },
      //   contact: {
      //     name: String,
      //     phoneNumber: String,
      //     avatar: String,
      //   },
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    forwardedFrom: {
      originalMessageId: {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
      originalSender: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
    deliveryStatus: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["sent", "delivered", "read"],
          default: "sent",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: Date,
    deletedAt: Date,
    deletedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reactions: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isSystemMessage: {
      type: Boolean,
      default: false,
    },
    systemMessageType: {
      type: String,
      enum: [
        "user_joined",
        "user_left",
        "group_created",
        "group_name_changed",
        "user_added",
        "user_removed",
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for Message model
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ chatId: 1, messageType: 1 });
messageSchema.index({ "deliveryStatus.user": 1, "deliveryStatus.status": 1 });
messageSchema.index({ mentions: 1 });
messageSchema.index({ createdAt: -1 });

// Message Methods
messageSchema.methods.markAsDelivered = function (userId) {
  const delivery = this.deliveryStatus.find(
    (d) => d.user.toString() === userId.toString()
  );
  if (delivery && delivery.status === "sent") {
    delivery.status = "delivered";
    delivery.timestamp = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

messageSchema.methods.markAsRead = function (userId) {
  const delivery = this.deliveryStatus.find(
    (d) => d.user.toString() === userId.toString()
  );
  if (delivery && delivery.status !== "read") {
    delivery.status = "read";
    delivery.timestamp = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

messageSchema.methods.addReaction = function (userId, emoji) {
  const existingReaction = this.reactions.find(
    (r) => r.user.toString() === userId.toString()
  );

  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.createdAt = new Date();
  } else {
    this.reactions.push({
      user: userId,
      emoji: emoji,
    });
  }

  return this.save();
};
const Message = model("Message", messageSchema);
