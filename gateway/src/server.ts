import { app } from "./app.js";
import { logger } from "./utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT!;

app.listen(PORT, () => {
  logger.info(`Api Gateway Server is running on PORT:${PORT}`);
});
