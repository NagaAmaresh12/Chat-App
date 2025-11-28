import { Router } from "express";
import fs from "node:fs";
import upload from "../config/multer.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
const router = Router();

router.post("/uploads", upload.single("file"), async (req, res) => {
  try {
    const result = await uploadToCloudinary(req.file?.path);
    console.log("====================================");
    console.log({ result });
    console.log("====================================");
    // ✅ Safely delete the temp file only if it exists
    if (req?.file?.path) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(200).json({
      message: "File uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error("Upload failed:", error.message);
    res.status(500).json({ message: "File upload failed" });
  }
});

export default router;
