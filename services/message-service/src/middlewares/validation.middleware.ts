// import { Request, Response, NextFunction } from "express";
// import { ZodError } from "zod";
// import type { ZodSchema } from "zod";

// // Body validation middleware
// export const validateBody = (schema: ZodSchema) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const validatedData = schema.parse(req.body);
//       req.body = validatedData;
//       next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         const errors = error?.errors?.map((err) => ({
//           field: err.path.join("."),
//           message: err.message,
//           code: err.code,
//         }));

//         return res.status(400).json({
//           success: false,
//           message: "Body validation failed",
//           errors,
//         });
//       }

//       return res.status(500).json({
//         success: false,
//         message: "Internal server error during body validation",
//       });
//     }
//   };
// };

// // Params validation middleware
// export const validateParams = (schema: ZodSchema) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const validatedData = schema.parse(req.params);
//       req.params = validatedData;
//       next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         const errors = error.errors.map((err) => ({
//           field: err.path.join("."),
//           message: err.message,
//           code: err.code,
//         }));

//         return res.status(400).json({
//           success: false,
//           message: "Parameters validation failed",
//           errors,
//         });
//       }

//       return res.status(500).json({
//         success: false,
//         message: "Internal server error during parameters validation",
//       });
//     }
//   };
// };

// // Query validation middleware
// export const validateQuery = (schema: ZodSchema) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const validatedData = schema.parse(req.query);
//       req.query = validatedData;
//       next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         const errors = error.errors.map((err) => ({
//           field: err.path.join("."),
//           message: err.message,
//           code: err.code,
//         }));

//         return res.status(400).json({
//           success: false,
//           message: "Query validation failed",
//           errors,
//         });
//       }

//       return res.status(500).json({
//         success: false,
//         message: "Internal server error during query validation",
//       });
//     }
//   };
// };
