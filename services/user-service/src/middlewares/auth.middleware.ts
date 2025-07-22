import { Request, Response, NextFunction } from "express";
import { sign, verify } from "jsonwebtoken";
import { isValid } from "../../../notification-service/src/utils/validation";
import { sendError } from "../../../notification-service/src/utils/response";
import { User } from "../models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const generateTokens = (payload: { id: string; email: string }) => {
  const newAccessToken = sign(payload, JWT_SECRET, { expiresIn: "15m" });
  const newRefreshToken = sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { newAccessToken, newRefreshToken };
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let accessToken =
      req.cookies?.accessToken || extractToken(req.headers.authorization);
    let refreshToken =
      req.cookies?.refreshToken || extractToken(req.headers["x-refresh-token"]);

    // If access token is present and valid
    if (isValid(accessToken)) {
      try {
        const decoded: any = verify(accessToken, JWT_SECRET);
        const user = await User.findOne({
          _id: decoded.id,
          email: decoded.email,
        });
        if (!user) return sendError(res, "User not found", 404);

        (req as any).user = user;
        return next();
      } catch (err) {
        // Access token invalid or expired → fall through to refresh token
        sendError(res, "TOKEN is Expired", 400);
      }
    }

    // Handle with refresh token
    if (!isValid(refreshToken))
      return sendError(res, "Invalid Refresh Token", 401);

    try {
      const decoded: any = verify(refreshToken, JWT_REFRESH_SECRET);
      const user = await User.findOne({
        _id: decoded.id,
        email: decoded.email,
      });
      if (!user) return sendError(res, "User not found", 404);

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        user.generateTokens();

      // Save refresh token to DB (example assumes field exists)
      user.refreshToken = {
        token: newRefreshToken,
        createdAt: new Date(),
      };
      await user.save();

      // Set tokens in cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      (req as any).user = user;
      return next();
    } catch (err) {
      return sendError(res, "Invalid or expired refresh token", 403);
    }
  } catch (err) {
    return sendError(res, "Authentication failed", 500);
  }
};

// Utility to extract Bearer token
function extractToken(headerValue?: string | string[]): string | undefined {
  if (typeof headerValue === "string" && headerValue.startsWith("Bearer ")) {
    return headerValue.split(" ")[1];
  }
  return undefined;
}
