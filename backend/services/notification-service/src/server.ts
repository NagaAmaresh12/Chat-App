import { logger } from "./utils/logger.js";
import { app } from "./app.js";
import { config } from "dotenv";
import { AppError } from "./utils/api.error.js";

config();

const PORT = process.env.PORT;
if (!PORT) {
  throw new AppError("Invalid Port at Notification Service");
}
app.listen(PORT, () => {
  logger.info(`Notification Server is running on Port${PORT}`);
});
