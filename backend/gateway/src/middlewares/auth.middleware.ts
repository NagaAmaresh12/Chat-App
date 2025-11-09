import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET_KEY!;

interface DecodedToken extends JwtPayload {
  userId: string;
  email?:string;
  username?:string;
  tokenType?:'access' | 'refresh'
  role?: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req?.cookies) {
      token = req?.cookies?.accessToken || req?.cookies?.refreshToken;
    }

    console.log("🔍 Incoming token:", token);

    if (!token) {
      return res.status(401).json({ message: "Token not found in headers or cookies" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as unknown as DecodedToken;
    console.log("✅ Decoded token:", decoded);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.headers["x-user-id"] = decoded.userId;
    if (decoded.role) req.headers["x-user-role"] = decoded.role;

    next();
  } catch (error) {
    console.error("❌ JWT verification failed:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
