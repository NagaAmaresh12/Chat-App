import express from "express";
import { connectToRabbitMQ } from "./config/rabbitMQ.js";
import path from "node:path";

import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const app = express();
app.get("/health", (req, res) => {
  res.json({
    token: req?.headers?.authorization,
    message: "Notification Service is Working",
  });
});
connectToRabbitMQ();

export { app };
