// compressFile.ts (for frontend)
import imageCompression from "browser-image-compression";

export async function compressImage(file: File) {
  const options = {
    maxSizeMB: 1, // limit file size
    maxWidthOrHeight: 800, // resize
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (err) {
    console.error("Compression failed:", err);
    return null;
  }
}
