//Api gateway cors
import cors from "cors";
import { config } from "dotenv";
config({
  override: true,
});
import { AppError } from "../utils/ApiError.js";
import { isValid } from "../utils/validation.js";

const USER_ORIGIN_URL = process.env.USER_ORIGIN_URL!;
if (!isValid(USER_ORIGIN_URL)) {
  console.log("user service url", USER_ORIGIN_URL);

  throw new AppError("ORIGIN IS NOT FOUND IN API GATEWAY", 500);
}
const corsMiddleware = cors({
  origin: "*", //[USER_ORIGIN_URL || "http://localhost:3000"]
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
});
export default corsMiddleware;
