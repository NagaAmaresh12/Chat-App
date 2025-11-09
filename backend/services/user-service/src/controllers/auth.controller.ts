import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendSuccess, sendError } from "../utils/response.js";
import { User } from "../models/user.model.js";
import { isValid } from "../utils/validation.js";
import { AppError } from "../utils/api.error.js";
import { generateOTP } from "../utils/otp.js";
import {
  deleteRedisKey,
  getRedisValue,
  setRedisValue,
} from "../config/redis.js";
import { publishToMailQueue } from "../config/rabbitMQ.js";
import { logger } from "../utils/logger.js";

// Constants
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const TOKEN_EXPIRY_MS = 1000 * 60 * 60; // 1 hour
const DEFAULT_OTP_EXPIRY_SECONDS = 300; // 5 minutes

export interface AuthRequest extends Request {
  user?: any;
  accessToken?: any;
  refreshToken?: any;
}
export interface AuthResponse extends Response {
  accessToken?: any;
  refreshToken?: any;
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
      body:req.body
    });

    if (!isValid(email) || !isValid(username)) {
      return sendError(res, "Invalid username or email provided", 400);
    }

    const redisKey = `otp=${email}`;
    const existingOTP = await getRedisValue(redisKey);
    console.log('====================================');
    console.log("existing OTP",existingOTP);
    console.log('====================================');
    if (existingOTP) {
      return sendError(res, "Too many requests. Try again later.", 429);
    }
    console.log("Generating OTP started");

    const otp = generateOTP(Number(OTPLength));
    logger.info(`Generated OTP :${otp}`);
    console.log({
      redisKey,
      otp,
  
    })
    const responseOTP = await setRedisValue(redisKey, otp, DEFAULT_OTP_EXPIRY_SECONDS);
    if(responseOTP == null){
      console.log("Failed to set OTP in redis")
    }
console.log('====================================');
console.log("responseOTP",responseOTP);
console.log('====================================');
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
console.log({user})
    const { accessToken, refreshToken } = user.generateTokens();
    console.log('====================================');
    console.log({
      accessToken,
      refreshToken
    });
    console.log('====================================');
    user.refreshToken = {
      token: refreshToken,
      createdAt: new Date(),
    };
    user.isOnline = true;
    await user.save();

    res.cookie("accessToken", accessToken, {
      maxAge: TOKEN_EXPIRY_MS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.cookie("refreshToken", refreshToken, {
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
export const me = (req: AuthRequest, res: AuthResponse) => {
  const user = req.user;
  if (!user) return sendError(res, "User not found in request", 400);

  const userData = {
    id: user._id,
    name: user.username,
    email: user.email,
  };
  console.log(
    "these two tokens will be exists only if accesstoken is expired, these tokens are from req?.accessToken and req?.refreshToken",
    {
      accessToken: req?.accessToken,
      refreshToken: req?.refreshToken,
      userData,
    }
  );

  if (req?.accessToken && req?.refreshToken) {
    console.log(
      "since new tokens generated and received from req. and setting both token in cookies in res......"
    );

    res.cookie("accessToken", req?.accessToken, {
      httpOnly: true,
      sameSite: "lax", // or "strict" in production
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", req?.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return sendSuccess(res, userData, "User is authenticated", 200);
};

// -----------------------------
// REFRESH TOKEN
// -----------------------------
export const refreshToken = async (req: AuthRequest, res: Response) => {
  try {
    // Try to get token from cookie first, then custom header, then Authorization header
    const tokenFromCookie = (req as any)?.cookies?.refreshToken;
    const tokenFromHeader = (req.headers["x-refresh-token"] as string) ||
      (typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);

    const token = tokenFromCookie || tokenFromHeader || req?.body?.refreshToken;

    if (!token) {
      return sendError(res, "Refresh token not provided", 401);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    } catch (err) {
      logger.info("Refresh token verify failed", { err });
      return sendError(res, "Invalid or expired refresh token", 401);
    }

    if (!decoded?.userId || decoded?.tokenType !== "refresh") {
      return sendError(res, "Invalid refresh token payload", 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user) return sendError(res, "User not found", 404);

    // Compare provided token with stored one
    if (!user.refreshToken || token !== user.refreshToken.token) {
      logger.info("Refresh token mismatch", { provided: token, stored: user.refreshToken?.token });
      return sendError(res, "Refresh token mismatch. Please login again.", 403);
    }

    // All good — generate new tokens and update stored refresh token
    const { accessToken, refreshToken: newRefreshToken } = user.generateTokens();
    user.refreshToken = { token: newRefreshToken, createdAt: new Date() };
    await user.save();

    // set cookies (similar to login)
    res.cookie("accessToken", accessToken, {
      maxAge: TOKEN_EXPIRY_MS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.cookie("refreshToken", newRefreshToken, {
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

    return sendSuccess(res, userResponse, "Token refreshed successfully", 200);
  } catch (error) {
    return sendError(res, "Failed to refresh token", 500, error);
  }
};

// -----------------------------
// LOGOUT
// -----------------------------
export const logout = async (req: AuthRequest, res: AuthResponse) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    user.refreshToken = { token: "", createdAt: new Date() };
    user.isOnline = false;
    await user.save();
    console.log({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });

    res.clearCookie("accessToken");
    const key = `otp=${user?.email}`;
    await deleteRedisKey(key);
    return sendSuccess(res, null, "Logout successful", 200);
  } catch (error) {
    return sendError(res, "Logout failed", 500, error);
  }
};
