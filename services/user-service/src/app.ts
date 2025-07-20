// app.ts
import { config } from "dotenv";
config();
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import { connectDB } from "./config/db.js";
import morgan from "morgan";
import { logger } from "./utils/logger.js";
const app = express();

//config
connectDB();

app.get("/", (req, res) => {
  res.json({
    message: "User Service is Working Fine",
  });
});

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Error Hanlder
app.use(errorHandler);
// Use morgan to log HTTP requests to winston
app.use(
  morgan("combined", {
    stream: {
      write: (message: any) => logger.info(message.trim()),
    },
  })
);

app.get("/health", (req, res) => {
  res.json({
    message: "Successfully get the request",
    success: true,
  });
});
export { app };
