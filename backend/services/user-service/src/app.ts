// app.ts
import { config } from "dotenv";
config({
  override: true,
});
import express from "express";
import { errorHandler } from "./middlewares/error.handler.js";
import morgan from "morgan";
import { logger } from "./utils/logger.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/people.route.js";
import cookieParser from "cookie-parser";
import {
  connectDB,
  connectToRedis,
  connectToRabbitMQ,
} from "./config/index.js";
const app = express();

//config
connectDB();
connectToRedis();
connectToRabbitMQ();

// user-service (3000)
app.get("/hi", (req, res) => {
  res.json({
    message: "User Service is Working Fine",
  });
});

app.get("/health", (req, res) => {
  res.json({ message: "User service is up and running" });
});
//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//routes
app.use("/auth", authRoutes);
app.use("/people", userRoutes);

// Use morgan to log HTTP requests to winston
app.use(
  morgan("combined", {
    stream: {
      write: (message: any) => logger.info(message.trim()),
    },
  })
);

//Error Hanlder
app.use(errorHandler);

export { app };
