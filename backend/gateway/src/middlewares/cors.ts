//Api gateway cors
import cors from "cors";
import { config } from "dotenv";
config({
  override: true,
});
import { AppError } from "../utils/ApiError.js";
import { isValid } from "../utils/validation.js";

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL!;
if (!isValid(USERS_SERVICE_URL)) {
  console.log("user service url", USERS_SERVICE_URL);

  throw new AppError("ORIGIN IS NOT FOUND IN API GATEWAY", 500);
}

const allowedOrigins = [
  "http://localhost:5173", // your Vite frontend
  "https://your-production-domain.com",
];
const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
});
export default corsMiddleware;
