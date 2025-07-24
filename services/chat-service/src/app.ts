import express from "express";
import { config } from "dotenv";
import morgan from "morgan";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import {
  connectDB,
  connectToRedis,
  connectToRabbitMQ,
} from "./config/index.js";
config();
const app = express();
//config

connectDB();
connectToRedis();
// connectToRabbitMQ()

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//routes
// app.use("/chat", authRoutes);
// app.use("/people", userRoutes);
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
