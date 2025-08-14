import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { isValid } from "../utils/validation.js";
import { sendError } from "../utils/response.js";
import axios from "axios";
import { config } from "dotenv";
config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const USER_SERVICE = process.env.USER_SERVICE!;
console.log({
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  USER_SERVICE,
});

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Authenticating in Chat service...");

    const accessToken =
      req.cookies?.accessToken || extractToken(req.headers.authorization);
    const refreshToken =
      req.cookies?.refreshToken ||
      extractToken(req.headers["x-refresh-token"] as string);

    console.log({
      accessToken,
      refreshToken,
    });
    if (isValid(accessToken)) {
      console.log("accesstoken is valid");

      try {
        console.log("decoding accesstoken");

        console.log("Finding user in db");
        const { data: healthData } = await axios.get(`${USER_SERVICE}/health`);
        console.log("Chat service Request reached to User-service", {
          healthData,
        });

        const { data } = await axios.get(`${USER_SERVICE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log({
          userData: data.data,
        });
        const user = data?.data;

        if (!user) return sendError(res, "User not found", 404);
        (req as any).user = user;
        return next();
      } catch (err) {
        res.status(400).json({
          message: "Invalid access token",
        });
        // Invalid or expired access token, fallback to refresh
      }
    } else if (!isValid(accessToken) && isValid(refreshToken)) {
      try {
        console.log("execution is in refreshtoken");
        const axiosResponse = await axios.get(
          `${USER_SERVICE}/auth/me`,

          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              message: "Access Token Expired",
            },
            withCredentials: true,
          }
        );
        const { data } = axiosResponse;
        const setCookieHeaders = axiosResponse.headers["set-cookie"];
        console.log("Cookies received:", setCookieHeaders);

        console.log({
          userData: data?.data,
        });
        if (setCookieHeaders) {
          console.log(
            "new accessToken and refreshToken set because accesstoken is expired"
          );

          const newAccessToken = setCookieHeaders?.[0]
            ?.split(";")[0]
            ?.split("=")[1];
          const newRefreshToken = setCookieHeaders?.[1]
            ?.split(";")[0]
            ?.split("=")[1];
          console.log("SetCookieHeaders", {
            newAccessToken,
            newRefreshToken,
          });
          res.cookie("accessToken", newAccessToken);
          res.cookie("refreshToken", newRefreshToken);
        }
        const user: any = data?.data;
        (req as any).user = user;
        return next();
      } catch (err) {
        return sendError(res, "Invalid or expired refresh token", 403);
      }
    } else {
      return sendError(res, "No Access Token and Refresh Token");
    }

    // Only reach here if accessToken is invalid/missing
  } catch (err) {
    return sendError(res, "Authentication failed", 500);
  }
};

// Extract Bearer token from header
function extractToken(headerValue?: string | string[]): string | undefined {
  if (typeof headerValue === "string" && headerValue.startsWith("Bearer ")) {
    return headerValue.split(" ")[1];
  }
  return undefined;
}

// import { Request, Response, NextFunction } from "express";
// import { sendError } from "../utils/response.js";
// import axios, { AxiosResponse } from "axios";
// import { config } from "dotenv";
// config();

// const USER_SERVICE = process.env.USER_SERVICE!;

// interface AuthenticatedRequest extends Request {
//   user?: any;
//   accessToken?: string;
//   refreshToken?: string;
// }

// interface UserServiceResponse {
//   success: boolean;
//   data?: any;
//   message?: string;
// }

// export const authenticate = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const serviceName = process.env.SERVICE_NAME || "Service";
//     console.log(`Authenticating in ${serviceName}...`);

//     // Extract tokens from cookies or headers
//     const accessToken = extractAccessToken(req);
//     const refreshToken = extractRefreshToken(req);

//     console.log("Authentication attempt:", {
//       hasAccessToken: !!accessToken,
//       hasRefreshToken: !!refreshToken,
//       serviceName,
//     });

//     // If no tokens provided at all
//     if (!accessToken && !refreshToken) {
//       return sendError(res, "Authentication required. Please login.", 401);
//     }

//     // Try to authenticate with access token first
//     if (accessToken) {
//       console.log(
//         "Attempting authentication with access token via user service"
//       );

//       const accessResult = await authenticateWithUserService(
//         accessToken,
//         "access"
//       );

//       if (accessResult.success) {
//         console.log("Valid access token - user authenticated");
//         req.user = accessResult.user;
//         return next();
//       }

//       // If access token is expired but we have refresh token, try refresh
//       if (accessResult.error === "expired" && refreshToken) {
//         console.log(
//           "Access token expired, attempting refresh via user service..."
//         );
//         // Continue to refresh token logic below
//       } else {
//         // Access token is invalid for other reasons
//         console.log("Access token invalid:", accessResult.message);
//         return sendError(
//           res,
//           accessResult.message || "Invalid access token",
//           401
//         );
//       }
//     }

//     // Try to authenticate/refresh with refresh token
//     if (refreshToken) {
//       console.log("Attempting token refresh via user service");

//       const refreshResult = await authenticateWithUserService(
//         refreshToken,
//         "refresh"
//       );

//       if (refreshResult.success) {
//         console.log("Token refreshed successfully via user service");
//         req.user = refreshResult.user;

//         // Set new tokens in cookies if they were generated
//         if (refreshResult.newTokens) {
//           setTokensInCookies(res, refreshResult.newTokens);
//           req.accessToken = refreshResult.newTokens.accessToken;
//           req.refreshToken = refreshResult.newTokens.refreshToken;
//         }

//         return next();
//       }

//       console.log("Refresh token failed:", refreshResult.message);
//       return sendError(
//         res,
//         refreshResult.message || "Session expired. Please login again.",
//         403
//       );
//     }

//     // No valid tokens found
//     return sendError(res, "No valid authentication token found", 401);
//   } catch (error) {
//     console.error("Authentication middleware error:", error);
//     return sendError(res, "Authentication failed", 500);
//   }
// };

// // Extract access token from cookies or Authorization header
// function extractAccessToken(req: Request): string | undefined {
//   // First try cookies
//   if (req.cookies?.accessToken) {
//     return req.cookies.accessToken;
//   }

//   // Then try Authorization header
//   return extractToken(req.headers.authorization);
// }

// // Extract refresh token from cookies or custom header
// function extractRefreshToken(req: Request): string | undefined {
//   // First try cookies
//   if (req.cookies?.refreshToken) {
//     return req.cookies.refreshToken;
//   }

//   // Then try custom header (for service-to-service communication)
//   return extractToken(req.headers["x-refresh-token"] as string);
// }

// // Extract Bearer token from header string
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

// // Authenticate with user service using axios
// async function authenticateWithUserService(
//   token: string,
//   tokenType: "access" | "refresh"
// ): Promise<{
//   success: boolean;
//   user?: any;
//   newTokens?: {
//     accessToken: string;
//     refreshToken: string;
//   };
//   error?: string;
//   message?: string;
// }> {
//   try {
//     console.log(`Making request to user service with ${tokenType} token`);

//     // First check if user service is available
//     try {
//       const { data: healthData } = await axios.get(`${USER_SERVICE}/health`, {
//         timeout: 5000,
//       });
//       console.log("User service health check passed:", healthData);
//     } catch (healthError) {
//       console.error("User service health check failed:", healthError.message);
//       return {
//         success: false,
//         error: "user_service_unavailable",
//         message: "User service is currently unavailable",
//       };
//     }

//     // Prepare headers based on token type
//     const headers: any = {
//       "Content-Type": "application/json",
//     };

//     if (tokenType === "access") {
//       headers.Authorization = `Bearer ${token}`;
//     } else {
//       // For refresh token, use the same approach as your original code
//       headers.Authorization = `Bearer ${token}`;
//       headers["x-refresh-token"] = token; // Also send in custom header
//       headers["message"] = "Access Token Expired"; // Signal that we need refresh
//     }

//     console.log("Sending request to user service:", {
//       url: `${USER_SERVICE}/auth/me`,
//       tokenType,
//       hasAuthHeader: !!headers.Authorization,
//     });

//     // Make request to user service /auth/me endpoint
//     const response: AxiosResponse = await axios.get(`${USER_SERVICE}/auth/me`, {
//       headers,
//       withCredentials: true, // Important for receiving cookies
//       timeout: 10000,
//     });

//     const { data }: { data: UserServiceResponse } = response;

//     console.log("User service response:", {
//       success: data.success,
//       hasUserData: !!data.data,
//       userId: data.data?._id || data.data?.id,
//     });

//     if (!data.success || !data.data) {
//       return {
//         success: false,
//         error: "authentication_failed",
//         message: data.message || "Authentication failed",
//       };
//     }

//     const result: any = {
//       success: true,
//       user: data.data,
//     };

//     // Check for new tokens in set-cookie headers (when refresh token was used)
//     const setCookieHeaders = response.headers["set-cookie"];
//     if (setCookieHeaders && setCookieHeaders.length > 0) {
//       console.log(
//         "Received set-cookie headers from user service:",
//         setCookieHeaders
//       );

//       const newTokens = parseTokensFromSetCookieHeaders(setCookieHeaders);
//       if (newTokens) {
//         console.log("Parsed new tokens from user service");
//         result.newTokens = newTokens;
//       }
//     }

//     return result;
//   } catch (error: any) {
//     console.error("User service request error:", error.message);

//     if (error.response) {
//       // The request was made and the server responded with a status code
//       const status = error.response.status;
//       const errorData = error.response.data;

//       console.log("User service error response:", {
//         status,
//         data: errorData,
//       });

//       if (status === 401) {
//         return {
//           success: false,
//           error: "expired",
//           message: errorData?.message || "Token expired",
//         };
//       }

//       if (status === 403) {
//         return {
//           success: false,
//           error: "invalid",
//           message: errorData?.message || "Invalid token",
//         };
//       }

//       if (status === 404) {
//         return {
//           success: false,
//           error: "user_not_found",
//           message: "User not found",
//         };
//       }

//       return {
//         success: false,
//         error: "authentication_failed",
//         message: errorData?.message || "Authentication failed",
//       };
//     } else if (error.request) {
//       // The request was made but no response was received
//       console.error("No response from user service");
//       return {
//         success: false,
//         error: "user_service_unavailable",
//         message: "User service is not responding",
//       };
//     } else {
//       // Something happened in setting up the request
//       console.error("Request setup error:", error.message);
//       return {
//         success: false,
//         error: "request_failed",
//         message: "Failed to make request to user service",
//       };
//     }
//   }
// }

// // Parse tokens from set-cookie headers received from user service
// function parseTokensFromSetCookieHeaders(setCookieHeaders: string[]): {
//   accessToken: string;
//   refreshToken: string;
// } | null {
//   try {
//     let accessToken = "";
//     let refreshToken = "";

//     console.log("Parsing tokens from set-cookie headers:", setCookieHeaders);

//     for (const cookieHeader of setCookieHeaders) {
//       // Parse accessToken
//       if (cookieHeader.includes("accessToken=")) {
//         const accessTokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
//         if (accessTokenMatch) {
//           accessToken = accessTokenMatch[1];
//         }
//       }

//       // Parse refreshToken
//       if (cookieHeader.includes("refreshToken=")) {
//         const refreshTokenMatch = cookieHeader.match(/refreshToken=([^;]+)/);
//         if (refreshTokenMatch) {
//           refreshToken = refreshTokenMatch[1];
//         }
//       }
//     }

//     console.log("Parsed tokens:", {
//       hasAccessToken: !!accessToken,
//       hasRefreshToken: !!refreshToken,
//     });

//     if (accessToken && refreshToken) {
//       return { accessToken, refreshToken };
//     }

//     console.log("Could not parse both tokens from headers");
//     return null;
//   } catch (error) {
//     console.error("Error parsing tokens from set-cookie headers:", error);
//     return null;
//   }
// }

// // Set tokens in cookies for this service
// function setTokensInCookies(
//   res: Response,
//   tokens: { accessToken: string; refreshToken: string }
// ): void {
//   const isProduction = process.env.NODE_ENV === "production";

//   console.log("Setting new tokens in cookies");

//   // Access token cookie (15 minutes)
//   res.cookie("accessToken", tokens.accessToken, {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: isProduction,
//     maxAge: 15 * 60 * 1000, // 15 minutes
//     path: "/",
//   });

//   // Refresh token cookie (7 days)
//   res.cookie("refreshToken", tokens.refreshToken, {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: isProduction,
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     path: "/",
//   });
// }

// // Health check endpoint for this service's authentication
// export const authHealthCheck = async (req: Request, res: Response) => {
//   try {
//     console.log("Checking auth health and user service connectivity");

//     // Test connection to user service
//     const userServiceResponse = await axios.get(`${USER_SERVICE}/health`, {
//       timeout: 5000,
//     });

//     res.json({
//       success: true,
//       message: "Authentication middleware healthy",
//       service: process.env.SERVICE_NAME || "unknown-service",
//       userService: {
//         status: "connected",
//         url: USER_SERVICE,
//         response: userServiceResponse.data,
//       },
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error: any) {
//     console.error("Auth health check failed:", error.message);
//     res.status(503).json({
//       success: false,
//       message: "Authentication middleware degraded",
//       service: process.env.SERVICE_NAME || "unknown-service",
//       userService: {
//         status: "disconnected",
//         url: USER_SERVICE,
//         error: error.message,
//       },
//       timestamp: new Date().toISOString(),
//     });
//   }
// };

// // Simple token validation without fetching user data (for lightweight endpoints)
// export const validateTokenOnly = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const accessToken = extractAccessToken(req);

//     if (!accessToken) {
//       return sendError(res, "Authentication required", 401);
//     }

//     // Just verify the token exists and is valid format
//     // For more thorough validation, use the main authenticate middleware
//     const result = await authenticateWithUserService(accessToken, "access");

//     if (result.success) {
//       req.user = { id: result.user._id || result.user.id }; // Minimal user info
//       return next();
//     }

//     return sendError(res, result.message || "Invalid token", 401);
//   } catch (error) {
//     console.error("Token validation error:", error);
//     return sendError(res, "Token validation failed", 500);
//   }
// };

// export default authenticate;
