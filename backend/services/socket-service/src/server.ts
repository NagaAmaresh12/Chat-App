import { logger } from "./utils/logger.js";
import { server } from "./app.js";
import { config } from "dotenv";
import { AppError } from "./utils/api.error.js";

config();

const PORT = process.env.PORT;
if (!PORT) {
  throw new AppError("Invalid Port at Socket Service");
}
server.listen(PORT, () => {
  logger.info(`Socket Server is running on Port${PORT}`);
});
