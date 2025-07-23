import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "./middlewares/cors.js";
import { ratelimiter } from "./middlewares/rate.limiter.js";
import routes from "./routes/index.js";
import { logger } from "./utils/logger.js";
import { helmetMiddleware } from "./middlewares/helmet.js";

config({
  override: true,
});
const app = express();
//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(helmetMiddleware);
app.use(cors);
// app.use(ratelimiter);
app.use("/api", routes);
logger.info("App middleware configured");
// Use morgan to log HTTP requests to winston
app.use(
  morgan("combined", {
    stream: {
      write: (message: any) => logger.info(message.trim()),
    },
  })
);
app.get("/", (req, res) => {
  res.json({
    message: "Api Gateway is working Fine",
  });
});
export { app };
