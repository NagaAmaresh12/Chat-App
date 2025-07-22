// app.ts
import { config } from "dotenv";
config();
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import { connectDB } from "./config/db.js";
import morgan from "morgan";
import { logger } from "../../notification-service/src/utils/logger.js";
import authRoutes from "./routes/auth.route.js";
// import userRoutes from "./routes/user.route.js";
import { connectToRedis } from "config/redis.js";
const app = express();

//config
connectDB();
// connectToRedis();

// user-service (3000)
app.get("/", (req, res) => {
  res.json({
    message: "User Service is Working Fine",
  });
});

app.get("/health", (req, res) => {
  res.json({ message: "Health check OK" });
});
//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
// app.use("/auth", authRoutes);
// app.use("/users", userRoutes);

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
