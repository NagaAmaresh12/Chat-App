import mongoose, { Document, Schema } from "mongoose";

export interface IAttachment {
  type: "image" | "video" | "audio" | "document";
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export interface IReplyTo {
  messageId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content?: string;
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
  chatType: "private" | "group"; // ✅ Added here
  senderId: mongoose.Types.ObjectId;
  content?: string;
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
  url: { type: String, required: true },
  filename: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  thumbnailUrl: { type: String },
});

const ReplyToSchema = new Schema<IReplyTo>({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  content: { type: String, maxlength: 200 },
  messageType: {
    type: String,
    enum: ["text", "media", "emoji"],
    required: false,
  },
});

const ForwardedFromSchema = new Schema<IForwardedFrom>({
  originalMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  originalSenderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  forwardedAt: { type: Date, default: Date.now },
});

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // ✅ Added chatType here
    chatType: {
      type: String,
      enum: ["private", "group"],
      required: true,
      index: true, // optional but helpful for grouped queries
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    content: {
      type: String,

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
    replyTo: { type: ReplyToSchema },
    forwardedFrom: { type: ForwardedFromSchema },
    editedAt: { type: Date },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId },
    isDeleted: { type: Boolean, default: false, index: true },
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    deliveredTo: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        deliveredAt: { type: Date, default: Date.now },
      },
    ],
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        emoji: { type: String, required: true },
        reactedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

// ✅ Updated Indexes
MessageSchema.index({ chatId: 1, chatType: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, isDeleted: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ content: "text" });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
