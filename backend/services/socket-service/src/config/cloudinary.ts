import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import fs from "fs";
import { config } from "dotenv";
config();
const CLOUDINARY_CLOUD_NAME = "dalu4afte";
const CLOUDINARY_API_KEY = "321935886561234";
const CLOUDINARY_API_SECRET = "j6DA9hu3Siz_EuAnTsnT3yzQlcU";

console.log({
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
