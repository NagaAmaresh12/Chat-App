import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { ObjectSchema } from "joi";

// Body validation middleware

export const validateJoiBody = (schema: ObjectSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Body validation failed",
        errors,
      });
    }

    req.body = value;
    next();
  };
};

// Params validation middleware
export const validateParams = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = (error as ZodError).issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: "Parameters validation failed",
          errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error during parameters validation",
      });
    }
  };
};

// Query validation middleware
export const validateQuery = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = (error as ZodError).issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: "Query validation failed",
          errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error during query validation",
      });
    }
  };
};
