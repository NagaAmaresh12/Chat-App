import mongoose, { Document, Schema } from "mongoose";

export interface IAttachment {
  type: "image" | "video" | "audio" | "document";
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string; // For videos and images
}

export interface IReplyTo {
  messageId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  messageType: "text" | "media" | "emoji";
}

export interface IForwardedFrom {
  originalMessageId: mongoose.Types.ObjectId;
  originalSenderId: mongoose.Types.ObjectId;
  forwardedAt: Date;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  messageType: "text" | "image" | "video" | "audio" | "document" | "emoji";
  attachments: IAttachment[];
  replyTo?: IReplyTo;
  forwardedFrom?: IForwardedFrom;
  editedAt?: Date;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  deliveredTo: Array<{
    userId: mongoose.Types.ObjectId;
    deliveredAt: Date;
  }>;
  reactions: Array<{
    userId: mongoose.Types.ObjectId;
    emoji: string;
    reactedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  type: {
    type: String,
    enum: ["image", "video", "audio", "document"],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: false,
  },
});

const ReplyToSchema = new Schema<IReplyTo>({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 200, // Truncated content for preview
  },
  messageType: {
    type: String,
    enum: ["text", "media", "emoji"],
    required: true,
  },
});

const ForwardedFromSchema = new Schema<IForwardedFrom>({
  originalMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  originalSenderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  forwardedAt: {
    type: Date,
    default: Date.now,
  },
});

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: function (this: IMessage) {
        return this.messageType === "text" || this.messageType === "emoji";
      },
      maxlength: 4000,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "emoji"],
      required: true,
      default: "text",
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
      validate: {
        validator: function (this: IMessage, attachments: IAttachment[]) {
          if (this.messageType === "text" || this.messageType === "emoji") {
            return attachments.length === 0;
          }
          return attachments.length > 0;
        },
        message: "Attachments validation failed",
      },
    },
    replyTo: {
      type: ReplyToSchema,
      required: false,
    },
    forwardedFrom: {
      type: ForwardedFromSchema,
      required: false,
    },
    editedAt: {
      type: Date,
      required: false,
    },
    deletedAt: {
      type: Date,
      required: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deliveredTo: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        deliveredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

// Compound indexes for efficient queries
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, isDeleted: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

// Text index for search functionality
MessageSchema.index({ content: "text" });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
