import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "./middlewares/cors.js";
import { ratelimiter } from "./middlewares/rate.limiter.js";
import routes from "./routes/index.js";
import { logger } from "./utils/logger.js";
import { helmetMiddleware } from "./middlewares/helmet.js";
import cookieParser from "cookie-parser";

config({
  override: true,
});
const app = express();
//middlewares
//❌❌❌❌should not use express.json() and express.urlencoded({extended:true}) , to send post request
// app.use(helmetMiddleware);
// app.use(ratelimiter);


app.use(cors);
// Enable JSON body parsing
// ✅ Enable cookie parsing
app.use(cookieParser());


app.use("/api", routes);

app.get("/health",(req,res)=>{
  res.send({message:"Gateway is Working"})
})
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
