import mongoose, { Schema, Document, model } from "mongoose";

interface Dimensions {
  width: number;
  height: number;
}

interface Metadata {
  duration?: number;
  dimensions?: Dimensions;
  compression?: string;
}

export interface MediaDocument extends Document {
  messageId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  filename: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url: string;
  thumbnailUrl?: string;
  cloudinaryPublicId?: string;
  metadata?: Metadata;
  isTemporary: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<MediaDocument>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: String,
    mimeType: String,
    size: Number,
    url: {
      type: String,
      required: true,
    },
    thumbnailUrl: String,
    cloudinaryPublicId: String,
    metadata: {
      duration: Number,
      dimensions: {
        width: Number,
        height: Number,
      },
      compression: String,
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
mediaSchema.index({ messageId: 1 });
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Media = model<MediaDocument>("Media", mediaSchema);
