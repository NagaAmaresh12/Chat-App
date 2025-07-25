import express from "express";
import { config } from "dotenv";
import morgan from "morgan";
import { logger } from "./utils/index.js";
import { errorHandler } from "./middlewares/index.js";
import {
  connectDB,
  connectToRedis,
  connectToRabbitMQ,
} from "./config/index.js";
import privateChatRoutes from "./routes/private.route.js";
import groupChatRoutes from "./routes/group.route.js";
import cookieParser from "cookie-parser";
config();
const app = express();
//config

connectDB();
connectToRedis();
connectToRabbitMQ();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//routes
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Chat service is up and running",
  });
});
app.use("/private", privateChatRoutes);
app.use("/groups", groupChatRoutes);
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
