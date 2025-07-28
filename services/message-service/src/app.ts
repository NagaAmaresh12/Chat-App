import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import {
  connectDB,
  connectToRabbitMQ,
  connectToRedis,
} from "./config/index.js";
// import { errorHandler } from "./middlewares/error.handler.js";
import { logger } from "./utils/index.js";
import morgan from "morgan";
import messageRoutes from "./routes/message.route.js";
config();
const app = express();
// //config
connectDB();
connectToRedis();
connectToRabbitMQ();
// //middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// // Use morgan to log HTTP requests to winston

app.get("/health", (req, res) => {
  res.json({ message: "User service is up and running" });
});
// //routes
app.use("/msg/v1", messageRoutes);

app.use(
  morgan("combined", {
    stream: {
      write: (message: any) => logger.info(message.trim()),
    },
  })
);
// //Error Handling
// app.use(errorHandler);
export { app };
