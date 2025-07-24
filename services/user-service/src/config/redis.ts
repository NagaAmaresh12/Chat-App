import { createClient, RESP_TYPES } from "redis";
import { config } from "dotenv";
config({
  override: true,
});
import { isValid } from "../utils/validation.js";
import { sendError } from "../utils/response.js";
import { AppError } from "../utils/api.error.js";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  throw new AppError("Invalide Redis Url in User service", 500);
}
export const redisClient = createClient({
  url: REDIS_URL,
});

export const connectToRedis = async () => {
  console.log("redis-url", REDIS_URL);

  if (!isValid(REDIS_URL!)) {
    throw new AppError("Invalid REDIS_URL in USER-SERVICE", 500);
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
