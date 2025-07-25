import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { isValid } from "../utils/validation.js";
import { sendError } from "../utils/response.js";
import { User } from "../models/user.model.js";
import { config } from "dotenv";
config();

const { TokenExpiredError } = jwt;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken =
      req.cookies?.accessToken || extractToken(req.headers.authorization);
    const refreshToken =
      req.cookies?.refreshToken ||
      extractToken(req.headers["x-refresh-token"] as string);
    console.log({
      accessToken,
      refreshToken,
      JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET,
    });

    if (!isValid(accessToken) && !isValid(refreshToken)) {
      return sendError(res, "Missing authentication tokens", 401);
    }

    // Try verifying access token first
    if (isValid(accessToken)) {
      try {
        const decoded = jwt.verify(
          accessToken,
          JWT_ACCESS_SECRET
        ) as JwtPayload;
        const user = await User.findById(decoded.userId);

        if (!user) return sendError(res, "User not found", 404);

        (req as any).user = user;
        return next();
      } catch (error) {
        // Check if access token is expired
        if (error instanceof TokenExpiredError) {
          console.log("Access token expired. Trying refresh token...");
          // Fall through to refresh token section below
        } else {
          console.log("Access token invalid:", error);
          return sendError(res, "Invalid access token", 401);
        }
      }
    }

    // Fallback: Try refresh token
    if (isValid(refreshToken)) {
      console.log("accessToken is expired and checking refreshtoken", {
        refreshToken,
      });

      try {
        const decoded = jwt.verify(
          refreshToken,
          JWT_REFRESH_SECRET
        ) as JwtPayload;
        const user = await User.findById(decoded.userId);

        if (!user) return sendError(res, "User not found", 404);

        if (refreshToken !== user.refreshToken?.token) {
          return sendError(
            res,
            "Refresh token mismatch. Please login again.",
            403
          );
        }

        // Set user on request and continue
        (req as any).user = user;
        return next();
      } catch (error) {
        console.log("Refresh token invalid or expired:", error);
        return sendError(res, "Session expired. Please login again.", 403);
      }
    }
    console.log("Both tokens are invalid");

    return sendError(res, "No valid token found", 401);
  } catch (err) {
    console.error("Authentication error:", err);
    return sendError(res, "Authentication failed", 500);
  }
};

// Extract Bearer token from header
function extractToken(headerValue?: string | string[]): string | undefined {
  if (!headerValue) return undefined;

  const headerString = Array.isArray(headerValue)
    ? headerValue[0]
    : headerValue;

  if (typeof headerString === "string") {
    if (headerString.startsWith("Bearer ")) {
      return headerString.slice(7).trim();
    }
    return headerString.trim();
  }

  return undefined;
}
