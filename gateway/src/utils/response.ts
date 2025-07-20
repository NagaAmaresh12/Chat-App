import type { Response } from "express";

export const sendSuccess = (
  res: Response,
  data: any = [],
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message = "Internal Server Error At User Service",
  statusCode = 500,
  error: any = {}
) => {
  return res.status(statusCode).json({
    status: "error",
    message,
    error,
  });
};
