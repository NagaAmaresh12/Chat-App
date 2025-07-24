import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { User } from "../models/user.model.js";
import { isValid } from "../utils/validation.js";
import { AppError } from "../utils/api.error.js";
import { generateOTP } from "../utils/otp.js";
import { getRedisValue, setRedisValue } from "../config/redis.js";
import { publishToMailQueue } from "../config/rabbitMQ.js";
import { logger } from "../utils/logger.js";

// Constants
const JWT_SECRET = process.env.JWT_SECRET as string;
const TOKEN_EXPIRY_MS = 1000 * 60 * 60; // 1 hour
const DEFAULT_OTP_EXPIRY_SECONDS = 300; // 5 minutes

export interface AuthRequest extends Request {
  user?: any;
}

// -----------------------------
// LOGIN - Generate OTP
// -----------------------------
export const login = async (req: Request, res: Response) => {
  console.log("request comes in login");

  try {
    const { email, OTPLength = 4, username } = req.body;
    console.log({
      email,
      username,
    });

    if (!isValid(email) || !isValid(username)) {
      return sendError(res, "Invalid username or email provided", 400);
    }

    const redisKey = `otp=${email}`;
    const existingOTP = await getRedisValue(redisKey);

    if (existingOTP) {
      return sendError(res, "Too many requests. Try again later.", 429);
    }
    console.log("Generating OTP started");

    const otp = generateOTP(Number(OTPLength));
    logger.info(`Generated OTP :${otp}`);
    await setRedisValue(redisKey, otp, DEFAULT_OTP_EXPIRY_SECONDS);

    const message = {
      to: email,
      subject: "Your One-Time Password (OTP) for Verification",
      text: `Your OTP is ${otp}. It is valid for ${
        DEFAULT_OTP_EXPIRY_SECONDS / 60
      } minutes.`,
    };
    console.log("Message", message);

    const isPublished: boolean = await publishToMailQueue(message, "MailQueue");
    console.log({
      isPublished,
    });

    if (!isPublished) {
      throw new AppError(
        "Failed to Publish the message in MailQueue @user-service"
      );
    }
    // return sendSuccess(res, null, "OTP sent successfully", 200);
    return res.json({
      message: "Message send to mail successfully",
      success: true,
    });
  } catch (error) {
    return sendError(res, "Failed to generate OTP", 500, error);
  }
};

// -----------------------------
// VERIFY OTP
// -----------------------------
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, username } = req.body;
    console.log({
      email,
      otp,
      username,
    });

    if (!isValid(email) || !isValid(otp)) {
      return sendError(res, "Email and OTP are required", 400);
    }

    const redisKey = `otp=${email}`;
    const storedOTP = await getRedisValue(redisKey);
    console.log({
      storedOTP,
    });

    if (!storedOTP) {
      return sendError(res, "OTP has expired or not found", 400);
    }

    if (otp !== storedOTP) {
      return sendError(res, "Incorrect OTP", 400);
    }
    console.log("OTP's are MATCHED");

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, username });
    }

    const { accessToken, refreshToken } = user.generateTokens();
    user.refreshToken = {
      token: refreshToken,
      createdAt: new Date(),
    };
    await user.save();

    res.cookie("accessToken", accessToken, {
      maxAge: TOKEN_EXPIRY_MS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.cookie("refresh", refreshToken, {
      maxAge: TOKEN_EXPIRY_MS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    const userResponse = {
      id: user._id,
      name: user.username,
      email: user.email,
      accessToken,
    };

    return sendSuccess(res, userResponse, "Login successful", 200);
  } catch (error) {
    return sendError(res, "Failed to verify OTP", 500, error);
  }
};

// -----------------------------
// ME - Get Authenticated User
// -----------------------------
export const me = (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return sendError(res, "User not found in request", 400);

  const userData = {
    id: user._id,
    name: user.username,
    email: user.email,
    accessToken: user.accessToken,
  };
  // const userData = { ...user };
  console.log({
    userData,
  });

  return sendSuccess(res, userData, "User is authenticated", 200);
};

// -----------------------------
// LOGOUT
// -----------------------------
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    user.refreshToken = { token: "", createdAt: new Date() };
    await user.save();

    res.clearCookie("accessToken");

    return sendSuccess(res, null, "Logout successful", 200);
  } catch (error) {
    return sendError(res, "Logout failed", 500, error);
  }
};

// -----------------------------
// FORGET PASSWORD = Generate OTP and send to email
// // -----------------------------
export const forgetPassword = async (req: Request, res: Response) => {
  console.log("request comes in forget Password");

  try {
    const { email, OTPLength = 4 } = req.body;

    if (!isValid(email)) {
      return sendError(res, "Invalid username or email provided", 400);
    }

    const isUserExist = await User.findOne({ email });
    if (!isUserExist) {
      return sendError(res, "User Does not Exists", 404);
    }
    const redisKey = `otp=${email}`;
    const existingOTP = await getRedisValue(redisKey);

    if (existingOTP) {
      return sendError(res, "Too many requests. Try again later.", 429);
    }

    const otp = generateOTP(Number(OTPLength));
    logger.info(`Generated OTP :${otp}`);
    await setRedisValue(redisKey, otp, DEFAULT_OTP_EXPIRY_SECONDS);

    const message = {
      to: email,
      subject: "Your One-Time Password (OTP) for Verification",
      text: `Your OTP is ${otp}. It is valid for ${
        DEFAULT_OTP_EXPIRY_SECONDS / 60
      } minutes.`,
    };

    const isPublished: boolean = await publishToMailQueue(message, "MailQueue");
    if (!isPublished) {
      throw new AppError(
        "Failed to Publish the message in MailQueue @user-service"
      );
    }
    // return sendSuccess(res, null, "OTP sent successfully", 200);
    return res.json({
      message: "Message send to mail successfully",
      success: true,
    });
  } catch (error) {
    return sendError(res, "Failed to generate OTP", 500, error);
  }
};

// // -----------------------------
// // RESET PASSWORD
// // -----------------------------
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!isValid(email) || !isValid(otp)) {
      return sendError(res, "Email and OTP are required", 400);
    }

    const redisKey = `otp=${email}`;
    const storedOTP = await getRedisValue(redisKey);

    if (!storedOTP) {
      return sendError(res, "OTP has expired or not found", 400);
    }

    if (otp !== storedOTP) {
      return sendError(res, "Incorrect OTP", 400);
    }

    let user = await User.findOne({ email });

    if (!user) {
      return sendError(res, "User does not exists", 404);
    }

    const { accessToken, refreshToken } = user.generateTokens();
    user.refreshToken = {
      token: refreshToken,
      createdAt: new Date(),
    };
    await user.save();

    res.cookie("accessToken", accessToken, {
      maxAge: TOKEN_EXPIRY_MS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    const userResponse = {
      id: user._id,
      name: user.username,
      email: user.email,
      accessToken,
    };

    return sendSuccess(res, userResponse, "Reseted Password  successful", 200);
  } catch (error) {
    return sendError(res, "Failed to verify OTP", 500, error);
  }
};
