import { Schema, model, Document, Types, Model } from "mongoose";

type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "location"
  | "contact";

type DeliveryStatusType = "sent" | "delivered" | "read";

type SystemMessageType =
  | "user_joined"
  | "user_left"
  | "group_created"
  | "group_name_changed"
  | "user_added"
  | "user_removed";

interface MediaContent {
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  duration?: number;
  thumbnail?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface DeliveryStatus {
  user: Types.ObjectId;
  status: DeliveryStatusType;
  timestamp: Date;
}

interface Reaction {
  user: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

interface ForwardedFrom {
  originalMessageId?: Types.ObjectId;
  originalSender?: Types.ObjectId;
}

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  messageType: MessageType;
  content: {
    text?: string;
    media?: MediaContent;
  };
  replyTo?: Types.ObjectId;
  forwardedFrom?: ForwardedFrom;
  deliveryStatus: DeliveryStatus[];
  editedAt?: Date;
  deletedAt?: Date;
  deletedFor: Types.ObjectId[];
  reactions: Reaction[];
  mentions: Types.ObjectId[];
  isSystemMessage: boolean;
  systemMessageType?: SystemMessageType;
  createdAt: Date;
  updatedAt: Date;

  markAsDelivered(userId: Types.ObjectId): Promise<IMessage>;
  markAsRead(userId: Types.ObjectId): Promise<IMessage>;
  addReaction(userId: Types.ObjectId, emoji: string): Promise<IMessage>;
}

const messageSchema = new Schema<IMessage>(
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
      text: { type: String },
      media: {
        url: String,
        filename: String,
        size: Number,
        mimeType: String,
        duration: Number,
        thumbnail: String,
        dimensions: {
          width: Number,
          height: Number,
        },
      },
    },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    forwardedFrom: {
      originalMessageId: { type: Schema.Types.ObjectId, ref: "Message" },
      originalSender: { type: Schema.Types.ObjectId, ref: "User" },
    },
    deliveryStatus: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
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
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        emoji: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
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
  { timestamps: true }
);

// Indexes
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ chatId: 1, messageType: 1 });
messageSchema.index({ "deliveryStatus.user": 1, "deliveryStatus.status": 1 });
messageSchema.index({ mentions: 1 });
messageSchema.index({ createdAt: -1 });

// Methods
messageSchema.methods.markAsDelivered = async function (
  userId: Types.ObjectId
) {
  const delivery = this.deliveryStatus.find(
    (d: any) => d.user.toString() === userId.toString()
  );
  if (delivery && delivery.status === "sent") {
    delivery.status = "delivered";
    delivery.timestamp = new Date();
    return this.save();
  }
  return this;
};

messageSchema.methods.markAsRead = async function (userId: Types.ObjectId) {
  const delivery = this.deliveryStatus.find(
    (d: any) => d.user.toString() === userId.toString()
  );
  if (delivery && delivery.status !== "read") {
    delivery.status = "read";
    delivery.timestamp = new Date();
    return this.save();
  }
  return this;
};

messageSchema.methods.addReaction = async function (
  userId: Types.ObjectId,
  emoji: string
) {
  const existingReaction = this.reactions.find(
    (r: any) => r.user.toString() === userId.toString()
  );
  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.createdAt = new Date();
  } else {
    this.reactions.push({ user: userId, emoji, createdAt: new Date() });
  }
  return this.save();
};

export const Message: Model<IMessage> = model<IMessage>(
  "Message",
  messageSchema
);
