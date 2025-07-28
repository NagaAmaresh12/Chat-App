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
      Headers: req.headers?.message,
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
      console.log("Access Token is being used at authmiddleware User-service");

      try {
        const decoded = jwt.verify(
          accessToken,
          JWT_ACCESS_SECRET
        ) as JwtPayload;
        console.log({
          decoded,
          decodedType: decoded?.tokenType,
        });

        const user = await User.findById(decoded.userId);

        if (!user) return sendError(res, "User not found", 404);
        //This will works only if other if request send by other services,
        // because when accessToken exipered user tried to send request then refresh token been used and
        // send response but we want to generate new accesstoken and refreshtoken everytime accesstoken is expired only
        //  when refresh token exists.this kind of process is already handle in user service but this will be executed
        // only when client directly send request to user serivce then user service can access the both tokens
        //  then it can decide whether new access and refresh tokens are need to generate or not but when we send request
        //  from any other services then when access token expired then refresh token will be used to send request
        //  at that time other service receive this token as accesstoken because we we are sending token through
        //  authorization and accessToken variable is what first receives the token and it will consider that
        // refreshtoken as accesstoken and code will be exicuted in accessToken control flow statement on user serive ,
        // so there we are checking if that particular token has field tokenType:"refresh",
        // then we can understand that token is refresh token and we generate new access and refresh tokens and
        //  set in response so that client can have new access and refreshtokens until refresh token expire.

        if (decoded?.tokenType == "refresh") {
          console.log(
            "since token type is 'refresh',access token is expired,generating new tokens"
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            user.generateTokens();
          user.refreshToken = {
            token: newRefreshToken,
            createdAt: new Date(),
          };
          await user.save();
          console.log("AccessToken was Expired, Generated New Access Token");
          //pass access and refresh tokens through req and get and set new tokens in cookies on every controller only if req?.accessToken and req?.refreshToken exists
          (req as any).accessToken = newAccessToken;
          (req as any).refreshToken = newRefreshToken;
        }
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

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          user.generateTokens();
        user.refreshToken = {
          token: newRefreshToken,
          createdAt: new Date(),
        };
        await user.save();
        console.log("AccessToken was Expired, Generated New Access Token");
        // Set tokens in cookies

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          sameSite: "lax", // or "strict" in production
          secure: process.env.NODE_ENV === "production",
          maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

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
