import mongoose from "mongoose";
import { isValid } from "../utils/validation.js";
import { AppError } from "../utils/api.error.js";
import { logger } from "../utils/logger.js";

export const connectDB = async (): Promise<void> => {
  const MONGO_URL = process.env.MONGO_URL;

  if (!isValid(MONGO_URL!)) {
    throw new AppError("Invalid MongoDB URL", 400);
  }

  try {
    await mongoose.connect(MONGO_URL!, {
      dbName: "user-service",
    });
    logger.info("🟢 MongoDB connected");
    // console.log("monogdb connected");
  } catch (error) {
    throw new AppError("Failed to connect to MongoDB", 500);
  }
};
