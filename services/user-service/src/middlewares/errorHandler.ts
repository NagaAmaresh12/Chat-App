import type { Request, Response, NextFunction } from "express";
import { logger } from "../../../notification-service/src/utils/logger.js";
import { sendError } from "../../../notification-service/src/utils/response.js";

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
