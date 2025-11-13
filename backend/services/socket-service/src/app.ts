import express from "express";
// import { connectToRabbitMQ } from "./config/rabbitMQ.js";
import path from "node:path";
import socketUploadRoutes from "./routes/upload.route.js";

import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const app = express();
app.get("/health", (req, res) => {
  res.json({
    token: req?.headers?.authorization,
    message: "Socket Service is Working",
  });
});
app.use("/files", socketUploadRoutes);
// connectToRabbitMQ();

export { app };
