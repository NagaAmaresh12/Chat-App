import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { User } from "../models/user.model.js";
import { isValid } from "../utils/validation.js";
import { AppError } from "../utils/ApiError.js";
import { generateOTP } from "../utils/otp.js";
import { getRedisValue, setRedisValue } from "../config/redis.js";
import { publishToMailQueue } from "../config/rabbitMQ.js";
import { logger } from "../utils/logger.js";

// Constants
const JWT_SECRET = process.env.JWT_SECRET as string;
const TOKEN_EXPIRY_MS = 1000 * 60 * 60; // 1 hour
const DEFAULT_OTP_EXPIRY_SECONDS = 300; // 5 minutes

interface AuthRequest extends Request {
  user?: any;
}

// -----------------------------
// LOGIN - Generate OTP
// -----------------------------
export const login = async (req: Request, res: Response) => {
  console.log("request comes in login");

  try {
    const { email, OTPLength = 4, username } = req.body;

    if (!isValid(email) || !isValid(username)) {
      return sendError(res, "Invalid username or email provided", 400);
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

// -----------------------------
// VERIFY OTP
// -----------------------------
export const verifyOTP = async (req: Request, res: Response) => {
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
      user = await User.create({ email });
    }

    const { accessToken, refreshToken } = await user.generateTokens();
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
// FORGET PASSWORD
// // -----------------------------
// export const forgetPassword = async (req: Request, res: Response) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) return sendError(res, "User not found", 404);

//   const otp = generateOTP();
//   await storeOTP(email, otp); // store in redis
//   await publishToMailQueue(
//     {
//       to: email,
//       subject: "Reset Password OTP",
//       text: `Your password reset OTP is ${otp}`,
//     },
//     "MailQueue"
//   );

//   return sendSuccess(res, null, "OTP sent to email", 200);
// };

// // -----------------------------
// // RESET PASSWORD
// // -----------------------------
// export const resetPassword = async (req: Request, res: Response) => {
//   const { email, otp, newPassword } = req.body;

//   const isOtpValid = await verifyStoredOTP(email, otp);
//   if (!isOtpValid) return sendError(res, "Invalid or expired OTP", 400);

//   const user = await User.findOne({ email });
//   if (!user) return sendError(res, "User not found", 404);

//   user.password = newPassword; // Make sure password hashing is handled in user model
//   await user.save();

//   return sendSuccess(res, null, "Password reset successfully", 200);
// };
