import jwt from "jsonwebtoken"; // default import
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET_KEY!;

// Access TokenExpiredError via jwt
const TokenExpiredError = (jwt as any).TokenExpiredError;

interface DecodedToken {
  userId: string;
  email?: string;
  username?: string;
  tokenType?: "access" | "refresh";
  role?: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token && req.cookies) {
      token = req.cookies.accessToken || req.cookies.refreshToken;
    }

    console.log("🔍 Incoming token:", token);

    if (!token) {
      return res.status(401).json({ success: false, message: "Token not found in headers or cookies in auth.middleware" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    console.log("✅ Decoded token:", decoded);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    req.headers["x-user-id"] = decoded.userId;
    req.headers.authorization = token;
    if (decoded.role) req.headers["x-user-role"] = decoded.role;

    next();
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      console.warn("⚠️ JWT token expired at:", error.expiredAt);
      return res.status(401).json({ success: false, message: "Token expired", expiredAt: error.expiredAt });
    }
    console.error("❌ JWT verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
