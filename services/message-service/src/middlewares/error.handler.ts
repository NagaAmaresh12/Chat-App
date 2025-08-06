import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { sendError } from "../utils/response.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.message);
  // console.log("err", err.message);

  const message = err?.message || "Something went wrong at User-service Server";
  const statusCode = 500;
  sendError(res, message, statusCode, err);
};

// import { ZodError } from "zod";

// export const errorHandler = (err, req, res, next) => {
//   console.error("Error:", err);

//   // Zod validation errors
//   if (err instanceof ZodError) {
//     const errors = err.errors.map((error) => ({
//       field: error.path.join("."),
//       message: error.message,
//       code: error.code,
//     }));

//     return res.status(400).json({
//       success: false,
//       message: "Validation failed",
//       errors,
//     });
//   }

//   // MongoDB validation errors
//   if (err.name === "ValidationError") {
//     const errors = Object.values(err.errors).map((error) => ({
//       field: error.path,
//       message: error.message,
//     }));

//     return res.status(400).json({
//       success: false,
//       message: "Database validation failed",
//       errors,
//     });
//   }

//   // MongoDB duplicate key error
//   if (err.code === 11000) {
//     return res.status(409).json({
//       success: false,
//       message: "Duplicate resource",
//       error: "A resource with this identifier already exists",
//     });
//   }

//   // MongoDB cast error (invalid ObjectId)
//   if (err.name === "CastError") {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid ID format",
//       error: `Invalid ${err.path}: ${err.value}`,
//     });
//   }

//   // JWT errors
//   if (err.name === "JsonWebTokenError") {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid token",
//     });
//   }

//   if (err.name === "TokenExpiredError") {
//     return res.status(401).json({
//       success: false,
//       message: "Token expired",
//     });
//   }

//   // Axios errors (microservice communication)
//   if (err.isAxiosError) {
//     const statusCode = err.response?.status || 500;
//     const message = err.response?.data?.message || "External service error";

//     return res.status(statusCode).json({
//       success: false,
//       message,
//       service: err.config?.baseURL || "unknown",
//     });
//   }

//   // Default error
//   const statusCode = err.statusCode || err.status || 500;
//   const message = err.message || "Internal server error";

//   res.status(statusCode).json({
//     success: false,
//     message,
//     ...(process.env.NODE_ENV === "development" && {
//       stack: err.stack,
//       error: err,
//     }),
//   });
// };
