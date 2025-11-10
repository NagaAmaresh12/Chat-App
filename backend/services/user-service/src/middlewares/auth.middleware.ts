import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sendError } from "../utils/response.js";
import { User } from "../models/user.model.js";
import { config } from "dotenv";
config();

const { TokenExpiredError, JsonWebTokenError } = jwt;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY!;

interface AuthenticatedRequest extends Request {
  user?: any;
  accessToken?: string;
  refreshToken?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const headerToken =  req?.headers?.authorization;
    const accessToken = extractAccessToken(req) || headerToken;
    const refreshToken = extractRefreshToken(req);

    if (!accessToken && !refreshToken)
      return sendError(res, "Authentication required", 401);

    // 1. Try access token
    if (accessToken) {
      const accessResult = await validateAccessToken(accessToken);

      if (accessResult.success) {
        req.user = accessResult.user;
        return next();
      }

      if (accessResult.error !== "expired") {
        return sendError(res, accessResult.message || "Invalid token", 401);
      }
      // else continue to refresh
    }

    // 2. Try refresh token
    if (refreshToken) {
      const refreshResult = await handleRefreshToken(refreshToken, req, res);

      if (refreshResult.success) {
        req.user = refreshResult.user;
        req.accessToken = refreshResult.newAccessToken;
        req.refreshToken = refreshResult.newRefreshToken;
        return next();
      }

      return sendError(
        res,
        refreshResult.message || "Session expired. Please login again.",
        403
      );
    }

    return sendError(res, "No valid authentication token found", 401);
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR => ", error);
    return sendError(res, "Authentication failed", 500);
  }
};

// ================= HELPERS =================

function extractAccessToken(req: Request): string | undefined {
  return req.cookies?.accessToken || extractToken(req.headers.authorization);
}

function extractRefreshToken(req: Request): string | undefined {
  return req.cookies?.refreshToken || extractToken(req.headers["x-refresh-token"] as string);
}

function extractToken(headerValue?: string | string[]): string | undefined {
  if (!headerValue) return undefined;
  const val = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (val?.startsWith("Bearer ")) return val.slice(7).trim();
  return val?.trim();
}

async function validateAccessToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
    console.log('====================================');
    console.log({
      decoded
    });
    console.log('====================================');
    if (decoded.tokenType !== "access") {
      return { success: false, error: "invalid", message: "Invalid token type" };
    }

    const user = await User.findById(decoded.userId);
    if (!user) return { success: false, error: "user_not_found", message: "User not found" };

    return { success: true, user };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { success: false, error: "expired" };
    return { success: false, error: "invalid", message: "Invalid access token" };
  }
}

async function handleRefreshToken(token: string, req: Request, res: Response) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;

    if (decoded.tokenType !== "refresh") return { success: false, message: "Invalid token type" };

    const user = await User.findById(decoded.userId);
    if (!user) return { success: false, message: "User not found" };

    if (token !== user.refreshToken?.token) return { success: false, message: "Refresh token mismatch" };

    const { accessToken: newAccess, refreshToken: newRefresh } = user.generateTokens();
    user.refreshToken = { token: newRefresh, createdAt: new Date() };
    await user.save();

    // detect if browser or microservice
    const fromBrowser = Boolean(req.cookies);

    if (fromBrowser) setCookieTokens(res, newAccess, newRefresh);
    else {
      res.setHeader("x-access-token", newAccess);
      res.setHeader("x-refresh-token", newRefresh);
    }

    return { success: true, user, newAccessToken: newAccess, newRefreshToken: newRefresh };
  } catch {
    return { success: false, message: "Refresh failed" };
  }
}

function setCookieTokens(res: Response, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 15 * 60 * 1000,
    path: "/"
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
}

export default authenticate;
