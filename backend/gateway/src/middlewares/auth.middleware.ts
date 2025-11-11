import jwt from "jsonwebtoken";
import axios from "axios";
import { Request, Response, NextFunction } from "express";

axios.defaults.withCredentials = true;

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY!;
const USERS_SERVICE =
  process.env.USERS_SERVICE || process.env.USERS_SERVICE_URL;
const { TokenExpiredError } = jwt;

interface DecodedToken {
  userId: string;
  email?: string;
  username?: string;
  tokenType?: "access" | "refresh";
  role?: string;
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    console.log("🔍 Incoming tokens:", {
      authHeader,
      accessToken,
      refreshToken,
    });

    // 1️⃣ Determine which token to verify
    let token: string | undefined;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (accessToken) {
      token = accessToken;
    }

    // 2️⃣ Handle case: No access token but refresh token exists → regenerate
    if (!token && refreshToken) {
      console.log("⚠️ No access token found. Trying to refresh tokens...");

      const refreshed = await regenerateTokens(refreshToken, res);
      if (!refreshed) {
        return res.status(401).json({
          success: false,
          message: "Failed to refresh tokens. Please login again.",
        });
      }

      // Apply new tokens to req headers/cookies
      req.cookies.accessToken = refreshed.accessToken;
      req.cookies.refreshToken = refreshed.refreshToken;
      req.headers.authorization = `Bearer ${refreshed.accessToken}`;
      req.headers["x-refresh-token"] = refreshed.refreshToken;

      const decoded = jwt.verify(
        refreshed.accessToken,
        JWT_SECRET_KEY
      ) as DecodedToken;
      req.headers["x-user-id"] = decoded.userId;
      if (decoded.role) req.headers["x-user-role"] = decoded.role;

      console.log("✅ Tokens refreshed successfully (no access token case)");
      return next();
    }

    // 3️⃣ If no token at all
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token not found" });
    }

    // 4️⃣ Verify access token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET_KEY) as DecodedToken;
    } catch (err: any) {
      // Token expired → try refresh
      if (err instanceof TokenExpiredError && refreshToken) {
        console.warn("⚠️ Access token expired — attempting to refresh...");

        const refreshed = await regenerateTokens(refreshToken, res);
        if (!refreshed) {
          return res.status(401).json({
            success: false,
            message: "Session expired. Please log in again.",
          });
        }

        // Update cookies/headers
        req.cookies.accessToken = refreshed.accessToken;
        req.cookies.refreshToken = refreshed.refreshToken;
        req.headers.authorization = `Bearer ${refreshed.accessToken}`;
        req.headers["x-refresh-token"] = refreshed.refreshToken;

        decoded = jwt.verify(
          refreshed.accessToken,
          JWT_SECRET_KEY
        ) as DecodedToken;
        console.log("✅ Tokens refreshed successfully after expiry");
      } else {
        console.error("❌ JWT verification failed:", err.message);
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }
    }

    // 5️⃣ Attach user info
    if (!decoded || !decoded.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token payload" });
    }

    req.headers["x-user-id"] = decoded.userId;
    if (decoded.role) req.headers["x-user-role"] = decoded.role;

    // 6️⃣ Ensure Bearer header for downstream
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      req.headers.authorization = `Bearer ${token}`;
    }

    next();
  } catch (error: any) {
    console.error("❌ Auth middleware error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal authentication error",
    });
  }
};

/**
 * ♻️ Helper function to call /auth/refresh-token and return new tokens
 */
const regenerateTokens = async (
  refreshToken: string,
  res: Response
): Promise<{ accessToken: string; refreshToken: string } | null> => {
  try {
    const refreshResponse = await axios.get(
      `${USERS_SERVICE}/auth/refresh-token`,
      {
        headers: { "x-refresh-token": refreshToken },
        withCredentials: true,
      }
    );

    const newAccessToken =
      refreshResponse.data?.accessToken ||
      refreshResponse.headers["x-access-token"];
    const newRefreshToken =
      refreshResponse.data?.refreshToken ||
      refreshResponse.headers["x-refresh-token"];

    if (!newAccessToken || !newRefreshToken) {
      console.error("❌ Failed to receive new tokens from refresh endpoint");
      return null;
    }

    // Forward Set-Cookie headers if present
    const setCookieHeader = refreshResponse.headers["set-cookie"];
    if (setCookieHeader) {
      res.setHeader("set-cookie", setCookieHeader);
      console.log("✅ Forwarded Set-Cookie headers:", setCookieHeader);
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error: any) {
    console.error("❌ Token regeneration failed:", error.message);
    return null;
  }
};
