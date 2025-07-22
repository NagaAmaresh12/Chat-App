import { createClient } from "redis";
import dotenv from "dotenv";
dotenv?.config();
import { isValid } from "../../../notification-service/src/utils/validation";
import { sendError } from "../../../notification-service/src/utils/response.js";
import { AppError } from "../../../notification-service/src/utils/ApiError.js";

const REDIS_URL =
  "rediss://default:AcZOAAIjcDE2YWZmMDc1OTYzOTU0MjlhYmVjODc4Y2YxODRhNDlkYXAxMA@loyal-magpie-50766.upstash.io:6379";
export const redisClient = createClient({
  url: REDIS_URL,
});

export const connectToRedis = async () => {
  console.log("redis-url", REDIS_URL);

  if (!isValid(REDIS_URL!)) {
    throw new AppError("Invalid REDIS_URL in USER-SERVICE");
  }
  try {
    await redisClient.connect();
    console.log("✅ Redis connected successfully");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    process.exit(1); // Exit the app if Redis fails
  }
};

// Utility: set value with optional expiry
export const setRedisValue = async (
  key: string,
  value: string,
  expiryInSeconds: number = 60
) => {
  await redisClient.setEx(key, expiryInSeconds, value);
};

// Utility: get value
export const getRedisValue = async (key: string): Promise<string | null> => {
  return await redisClient.get(key);
};

// Utility: delete value
export const deleteRedisKey = async (key: string) => {
  await redisClient.del(key);
};
