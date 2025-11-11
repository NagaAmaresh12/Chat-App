import cloudinary from "../config/cloudinary.js";
import { UploadApiResponse } from "cloudinary";

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resource_type?: "auto" | "image" | "video" | "raw";
    public_id?: string;
  } = {}
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:
          options.folder ||
          process.env.CLOUDINARY_UPLOAD_FOLDER ||
          "chat_uploads",
        resource_type: options.resource_type || "auto",
        public_id: options.public_id,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      }
    );
    stream.end(buffer);
  });
}
