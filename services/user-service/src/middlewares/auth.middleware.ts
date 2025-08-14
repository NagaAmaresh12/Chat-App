// import { Request, Response, NextFunction } from "express";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import { isValid } from "../utils/validation.js";
// import { sendError } from "../utils/response.js";
// import { User } from "../models/user.model.js";
// import { config } from "dotenv";
// config();

// const { TokenExpiredError } = jwt;
// const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
// const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// export const authenticate = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const accessToken =
//       req.cookies?.accessToken || extractToken(req.headers.authorization);
//     const refreshToken =
//       req.cookies?.refreshToken ||
//       extractToken(req.headers["x-refresh-token"] as string);
//     console.log({
//       Headers: req.headers?.message,
//       accessToken,
//       refreshToken,
//       JWT_ACCESS_SECRET,
//       JWT_REFRESH_SECRET,
//     });

//     if (!isValid(accessToken) && !isValid(refreshToken)) {
//       return sendError(res, "Missing authentication tokens", 401);
//     }

//     // Try verifying access token first
//     if (isValid(accessToken)) {
//       console.log("Access Token is being used at authmiddleware User-service");

//       try {
//         const decoded = jwt.verify(
//           accessToken,
//           JWT_ACCESS_SECRET
//         ) as JwtPayload;
//         console.log({
//           decoded,
//           decodedType: decoded?.tokenType,
//         });

//         const user = await User.findById(decoded.userId);

//         if (!user) return sendError(res, "User not found", 404);
//         //This will works only if other if request send by other services,
//         // because when accessToken exipered user tried to send request then refresh token been used and
//         // send response but we want to generate new accesstoken and refreshtoken everytime accesstoken is expired only
//         //  when refresh token exists.this kind of process is already handle in user service but this will be executed
//         // only when client directly send request to user serivce then user service can access the both tokens
//         //  then it can decide whether new access and refresh tokens are need to generate or not but when we send request
//         //  from any other services then when access token expired then refresh token will be used to send request
//         //  at that time other service receive this token as accesstoken because we we are sending token through
//         //  authorization and accessToken variable is what first receives the token and it will consider that
//         // refreshtoken as accesstoken and code will be exicuted in accessToken control flow statement on user serive ,
//         // so there we are checking if that particular token has field tokenType:"refresh",
//         // then we can understand that token is refresh token and we generate new access and refresh tokens and
//         //  set in response so that client can have new access and refreshtokens until refresh token expire.

//         if (decoded?.tokenType == "refresh") {
//           console.log(
//             "since token type is 'refresh',access token is expired,generating new tokens"
//           );

//           const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
//             user.generateTokens();
//           user.refreshToken = {
//             token: newRefreshToken,
//             createdAt: new Date(),
//           };
//           await user.save();
//           console.log("AccessToken was Expired, Generated New Access Token");
//           //pass access and refresh tokens through req and get and set new tokens in cookies on every controller only if req?.accessToken and req?.refreshToken exists
//           (req as any).accessToken = newAccessToken;
//           (req as any).refreshToken = newRefreshToken;
//         }
//         (req as any).user = user;
//         return next();
//       } catch (error) {
//         // Check if access token is expired
//         if (error instanceof TokenExpiredError) {
//           console.log("Access token expired. Trying refresh token...");
//           // Fall through to refresh token section below
//         } else {
//           console.log("Access token invalid:", error);
//           return sendError(res, "Invalid access token", 401);
//         }
//       }
//     }

//     // Fallback: Try refresh token
//     if (isValid(refreshToken)) {
//       console.log("accessToken is expired and checking refreshtoken", {
//         refreshToken,
//       });

//       try {
//         const decoded = jwt.verify(
//           refreshToken,
//           JWT_REFRESH_SECRET
//         ) as JwtPayload;
//         const user = await User.findById(decoded.userId);

//         if (!user) return sendError(res, "User not found", 404);
//         console.log({
//           refreshToken,
//           userRefreshToken: user?.refreshToken?.token,
//         });

//         if (refreshToken !== user.refreshToken?.token) {
//           return sendError(
//             res,
//             "Refresh token mismatch. Please login again.",
//             403
//           );
//         }

//         const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
//           user.generateTokens();
//         user.refreshToken = {
//           token: newRefreshToken,
//           createdAt: new Date(),
//         };
//         await user.save();
//         console.log("AccessToken was Expired, Generated New Access Token");
//         // Set tokens in cookies

//         res.cookie("accessToken", newAccessToken, {
//           httpOnly: true,
//           sameSite: "lax", // or "strict" in production
//           secure: process.env.NODE_ENV === "production",
//           maxAge: 15 * 60 * 1000,
//         });

//         res.cookie("refreshToken", newRefreshToken, {
//           httpOnly: true,
//           sameSite: "lax",
//           secure: process.env.NODE_ENV === "production",
//           maxAge: 7 * 24 * 60 * 60 * 1000,
//         });

//         // Set user on request and continue
//         (req as any).user = user;
//         return next();
//       } catch (error) {
//         console.log("Refresh token invalid or expired:", error);
//         return sendError(res, "Session expired. Please login again.", 403);
//       }
//     }
//     console.log("Both tokens are invalid");

//     return sendError(res, "No valid token found", 401);
//   } catch (err) {
//     console.error("Authentication error:", err);
//     return sendError(res, "Authentication failed", 500);
//   }
// };

// // Extract Bearer token from header
// function extractToken(headerValue?: string | string[]): string | undefined {
//   if (!headerValue) return undefined;

//   const headerString = Array.isArray(headerValue)
//     ? headerValue[0]
//     : headerValue;

//   if (typeof headerString === "string") {
//     if (headerString.startsWith("Bearer ")) {
//       return headerString.slice(7).trim();
//     }
//     return headerString.trim();
//   }

//   return undefined;
// }

// New code:
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { isValid } from "../utils/validation.js";
import { sendError } from "../utils/response.js";
import { User } from "../models/user.model.js";
import { config } from "dotenv";
config();

const { TokenExpiredError, JsonWebTokenError, NotBeforeError } = jwt;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

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
    // Extract tokens from cookies or headers
    const accessToken = extractAccessToken(req);
    const refreshToken = extractRefreshToken(req);

    console.log("Authentication attempt:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      userAgent: req.headers["user-agent"],
      origin: req.headers.origin,
    });

    // If no tokens provided at all
    if (!accessToken && !refreshToken) {
      return sendError(res, "Authentication required. Please login.", 401);
    }

    // Try to authenticate with access token first
    if (accessToken) {
      const accessResult = await validateAccessToken(accessToken);

      if (accessResult.success) {
        console.log("Valid access token used");
        req.user = accessResult.user;
        return next();
      }

      // If access token is expired but we have refresh token, continue to refresh logic
      if (accessResult.error === "expired" && refreshToken) {
        console.log("Access token expired, attempting refresh...");
        // Continue to refresh token logic below
      } else {
        // Access token is invalid for reasons other than expiration
        return sendError(
          res,
          accessResult.message || "Invalid access token",
          401
        );
      }
    }

    // Try to authenticate/refresh with refresh token
    if (refreshToken) {
      const refreshResult = await handleRefreshToken(refreshToken, res);

      if (refreshResult.success) {
        console.log("Token refreshed successfully");
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

    // No valid tokens found
    return sendError(res, "No valid authentication token found", 401);
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return sendError(res, "Authentication failed", 500);
  }
};

// Extract access token from cookies or Authorization header
function extractAccessToken(req: Request): string | undefined {
  // First try cookies
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // Then try Authorization header
  return extractToken(req.headers.authorization);
}

// Extract refresh token from cookies or custom header
function extractRefreshToken(req: Request): string | undefined {
  // First try cookies
  if (req.cookies?.refreshToken) {
    return req.cookies.refreshToken;
  }

  // Then try custom header (for service-to-service communication)
  return extractToken(req.headers["x-refresh-token"] as string);
}

// Extract Bearer token from header string
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

// Validate access token
async function validateAccessToken(token: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  message?: string;
}> {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;

    // Validate token structure
    if (!decoded.userId || !decoded.tokenType) {
      return {
        success: false,
        error: "invalid",
        message: "Invalid token structure",
      };
    }

    // Check if it's actually an access token
    if (decoded.tokenType !== "access") {
      return {
        success: false,
        error: "invalid",
        message: "Invalid token type",
      };
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return {
        success: false,
        error: "user_not_found",
        message: "User not found",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return {
        success: false,
        error: "expired",
        message: "Access token expired",
      };
    }

    if (error instanceof JsonWebTokenError) {
      return {
        success: false,
        error: "invalid",
        message: "Invalid access token",
      };
    }

    return {
      success: false,
      error: "unknown",
      message: "Token validation failed",
    };
  }
}

// Handle refresh token validation and token generation
async function handleRefreshToken(
  refreshToken: string,
  res: Response
): Promise<{
  success: boolean;
  user?: any;
  newAccessToken?: string;
  newRefreshToken?: string;
  message?: string;
}> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;

    // Validate token structure
    if (!decoded.userId || !decoded.tokenType) {
      return {
        success: false,
        message: "Invalid refresh token structure",
      };
    }

    // Check if it's actually a refresh token
    if (decoded.tokenType !== "refresh") {
      return {
        success: false,
        message: "Invalid token type for refresh",
      };
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Validate refresh token matches stored token
    if (!user.refreshToken || refreshToken !== user.refreshToken.token) {
      console.log("Refresh token mismatch:", {
        provided: refreshToken,
        stored: user.refreshToken?.token,
      });
      return {
        success: false,
        message: "Invalid refresh token. Please login again.",
      };
    }

    // Check if refresh token is still valid (not too old)
    const refreshTokenAge =
      Date.now() - new Date(user.refreshToken.createdAt).getTime();
    const maxRefreshAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (refreshTokenAge > maxRefreshAge) {
      return {
        success: false,
        message: "Refresh token expired. Please login again.",
      };
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      user.generateTokens();

    // Update refresh token in database
    user.refreshToken = {
      token: newRefreshToken,
      createdAt: new Date(),
    };

    await user.save();

    // Set new tokens in cookies
    setCookieTokens(res, newAccessToken, newRefreshToken);

    console.log("Generated new tokens for user:", user._id);

    return {
      success: true,
      user,
      newAccessToken,
      newRefreshToken,
    };
  } catch (error) {
    console.error("Refresh token validation error:", error);

    if (error instanceof TokenExpiredError) {
      return {
        success: false,
        message: "Refresh token expired. Please login again.",
      };
    }

    if (error instanceof JsonWebTokenError) {
      return {
        success: false,
        message: "Invalid refresh token. Please login again.",
      };
    }

    return {
      success: false,
      message: "Token refresh failed. Please login again.",
    };
  }
}

// Set tokens in HTTP-only cookies
function setCookieTokens(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  const isProduction = process.env.NODE_ENV === "production";

  // Access token cookie (15 minutes)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  });

  // Refresh token cookie (7 days)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

// Optional: Middleware for service-to-service authentication
export const authenticateService = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // For service-to-service, we might want to use a different approach
    // like API keys or service tokens, but this will work with the same JWT logic

    const token = extractAccessToken(req) || extractRefreshToken(req);

    if (!token) {
      return sendError(res, "Service authentication required", 401);
    }

    // Try as access token first
    const accessResult = await validateAccessToken(token);
    if (accessResult.success) {
      req.user = accessResult.user;
      return next();
    }

    // If that fails, we might need different logic for service tokens
    // For now, treat it the same as regular authentication
    return authenticate(req, res, next);
  } catch (error) {
    console.error("Service authentication error:", error);
    return sendError(res, "Service authentication failed", 500);
  }
};

export default authenticate;
