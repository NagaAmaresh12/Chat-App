import { Request, Response } from "express";
import { sendSuccess, sendError } from "utils/response";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"; // assuming you have a User model
import { isValid } from "utils/validation.js";
import { AppError } from "utils/ApiError.js";
// import { generateOTP, verifyStoredOTP, storeOTP } from "../utils/otp.util.js";

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY = "1h";

export const login = async (req: Request, res: Response) => {
  const { email ,OTPLenth} = req.body;
  if(!isValid(email)){
    return sendError(res,"Invalid Credentials",400);
  }


  // Generate & store OTP
  const otp = generateOTP(OTPLenth);
  await storeOTP(email, otp); // store in DB or Redis

  Send OTP to user (mocked or real email)
  await sendOtpEmail(email, otp);

  return sendSuccess(res, "OTP sent successfully", null, 200);
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
    if(!isValid(email) || !isValid(otp)){
    return sendError(res,"Invalid Credentials",400);
  }
  const isExistUser = await User.findOne({email});

  if(!isExistUser){
    return sendError(res, "User Does not Exists",400);
  }
  // const isValid = await verifyStoredOTP(email, otp);
  if (!isValid) return sendError(res, "Invalid or expired OTP", 400);

  // Check if user exists, else create
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email });

  // Generate token
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  return sendSuccess(res, "OTP verified", { token, user }, 200);
};

export const me = async (req: Request, res: Response) => {
  const user = req.user;
  sendSuccess(res, "User is logged in", user, 200);
};

export const logout = async (req: Request, res: Response) => {
  // If using JWT in header, nothing to invalidate — frontend should delete token
  // If using refresh token, invalidate it here
  sendSuccess(res, "Logged out successfully", null, 200);
};

export const forgetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found", 404);

  const otp = generateOTP();
  await storeOTP(email, otp);
  await sendOtpEmail(email, otp);

  sendSuccess(res, "OTP sent to email for password reset", null, 200);
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const isValid = await verifyStoredOTP(email, otp);
  if (!isValid) return sendError(res, "Invalid or expired OTP", 400);

  const user = await User.findOne({ email });
  if (!user) return sendError(res, "User not found", 404);

  user.password = newPassword; // hash if needed
  await user.save();

  sendSuccess(res, "Password reset successfully", null, 200);
};
