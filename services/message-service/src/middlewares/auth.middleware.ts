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
