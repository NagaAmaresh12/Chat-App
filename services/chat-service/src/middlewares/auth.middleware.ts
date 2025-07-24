// import { Request, Response, NextFunction } from "express";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import { isValid } from "../utils/validation.js";
// import { sendError } from "../utils/response.js";
// import { User } from "../models/user.model.js";

// const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
// const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
// console.log({
//   JWT_ACCESS_SECRET,
//   JWT_REFRESH_SECRET,
// });

// export const authenticate = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const accessToken =
//       req.cookies?.accessToken || extractToken(req.headers.authorization);
//     console.log({
//       accessToken,
//     });
//     const refreshToken =
//       req.cookies?.refreshToken ||
//       extractToken(req.headers["x-refresh-token"] as string);

//     if (isValid(accessToken)) {
//       console.log("accesstoken is valid");

//       try {
//         console.log("decoding accesstoken");

//         const decoded: any = jwt.verify(
//           accessToken,
//           JWT_ACCESS_SECRET
//         ) as JwtPayload;
//         console.log({
//           decoded,
//         });
//         console.log("Finding user in db");

//         const user = await User.findOne({
//           email: decoded.email,
//         });
//         console.log({
//           user,
//         });

//         if (!user) return sendError(res, "User not found", 404);
//         (req as any).user = user;
//         return next();
//       } catch (err) {
//         res.status(400).json({
//           message: "Invalid access token",
//         });
//         // Invalid or expired access token, fallback to refresh
//       }
//     } else if (!isValid(accessToken) && isValid(refreshToken)) {
//       try {
//         const decoded: any = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
//         console.log("execution is in refreshtoken");
//         const user = await User.findOne({
//           _id: decoded.id,
//           email: decoded.email,
//         });
//         if (!user) return sendError(res, "User not found", 404);

//         const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
//           user.generateTokens();

//         user.refreshToken = {
//           token: newRefreshToken,
//           createdAt: new Date(),
//         };
//         await user.save();

//         res.cookie("accessToken", newAccessToken, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "lax",
//           maxAge: 15 * 60 * 1000,
//         });

//         res.cookie("refreshToken", newRefreshToken, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "lax",
//           maxAge: 7 * 24 * 60 * 60 * 1000,
//         });

//         (req as any).user = user;
//         return next();
//       } catch (err) {
//         return sendError(res, "Invalid or expired refresh token", 403);
//       }
//     } else {
//       return sendError(res, "No Access Token and Refresh Token");
//     }

//     // Only reach here if accessToken is invalid/missing
//   } catch (err) {
//     return sendError(res, "Authentication failed", 500);
//   }
// };

// // Extract Bearer token from header
// function extractToken(headerValue?: string | string[]): string | undefined {
//   if (typeof headerValue === "string" && headerValue.startsWith("Bearer ")) {
//     return headerValue.split(" ")[1];
//   }
//   return undefined;
// }
