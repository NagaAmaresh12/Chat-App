import { Schema, Document, model } from "mongoose";
const mediaSchema = new Schema(
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
      duration: Number, // for audio/video
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

// Indexes for Media model
mediaSchema.index({ messageId: 1 });
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Media = mongoose.model("Media", mediaSchema);
