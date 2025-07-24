import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { isValid } from "../utils/validation.js";
import { sendError } from "../utils/response.js";
import { User } from "../models/user.model.js";
import { config } from "dotenv";
config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
console.log({
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
});

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Authenticating in User service...");

  try {
    // Extract tokens from cookies or headers
    const accessToken =
      req.cookies?.accessToken || extractToken(req.headers.authorization);
    const refreshToken =
      req.cookies?.refreshToken ||
      extractToken(req.headers["x-refresh-token"] as string);

    console.log({
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      cookies: req?.cookies,
      Authorization: req?.headers?.authorization,
    });

    // Check if both tokens are missing
    if (!isValid(accessToken) && !isValid(refreshToken)) {
      return sendError(res, "Invalid tokens", 401);
    }

    // Try access token first if it exists and is valid
    if (isValid(accessToken)) {
      console.log("Access token is valid, attempting verification...");
      console.log("Decoding starting...");
      let decoded: any;
      try {
        console.log({
          accessToken,
          JWT_ACCESS_SECRET,
        });

        decoded = jwt.verify(accessToken, JWT_ACCESS_SECRET);
        console.log("Access token decoded successfully:", {
          decoded,
          userId: decoded.userId,
        });
      } catch (error) {
        return sendError(res, "Failed to Decode Token", 400);
      }
      console.log("Fetching user data By ID...");

      try {
        // Find user using the correct field from token payload
        // Based on your schema, tokens contain userId, phoneNumber, username
        const user = await User.findById(decoded.userId);

        if (!user) {
          console.log("User not found for decoded token");
          return sendError(res, "User not found", 404);
        }

        console.log("User found, authentication successful");
        (req as any).user = user;
        return next();
      } catch (accessTokenError) {
        console.log("Access token verification failed:", accessTokenError);

        // If access token is invalid but refresh token exists, try refresh token
        if (isValid(refreshToken)) {
          console.log("Access token invalid, trying refresh token...");
          // Continue to refresh token logic below
          const decoded: any = jwt.verify(
            refreshToken,
            JWT_REFRESH_SECRET
          ) as JwtPayload;
          console.log("Access token decoded successfully:", {
            decoded,
            userId: decoded.userId,
          });

          // Find user using the correct field from token payload
          // Based on your schema, tokens contain userId, phoneNumber, username
          const user = await User.findById(decoded.userId);

          if (!user) {
            console.log("User not found for decoded token");
            return sendError(res, "User not found", 404);
          }

          console.log("User found, authentication successful");
          (req as any).user = user;
          return next();
        } else {
          return sendError(
            res,
            "Invalid access token and no valid refresh token",
            401
          );
        }
      }
    }
  } catch (error) {
    return sendError(res, "Invalid Tokens", 400, error);
  }
};
// Extract Bearer token from header - improved version
function extractToken(headerValue?: string | string[]): string | undefined {
  if (!headerValue) return undefined;

  const headerString = Array.isArray(headerValue)
    ? headerValue[0]
    : headerValue;

  if (typeof headerString === "string") {
    // Handle both "Bearer token" and just "token" formats
    if (headerString.startsWith("Bearer ")) {
      return headerString.slice(7).trim(); // Remove "Bearer " prefix
    }
    // If it doesn't start with Bearer, assume it's just the token
    return headerString.trim();
  }

  return undefined;
}
