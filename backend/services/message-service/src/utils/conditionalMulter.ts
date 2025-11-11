// Conditional multer middleware
// export const conditionalMulter = (req: Request, res: Response, next: NextFunction) => {
//   const contentType = req.headers["content-type"] || "";

//   // Only use multer for multipart/form-data
//   if (contentType.includes("multipart/form-data")) {
//     return upload.array("attachments", 10)(req, res, next);
//   }

//   // For JSON requests, skip multer
//   next();
// };
