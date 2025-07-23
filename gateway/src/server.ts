import { app } from "./app.js";
import { logger } from "./utils/logger.js";
import { config } from "dotenv";

config({
  override: true,
});

const PORT = process.env.PORT!;

app.listen(PORT, () => {
  logger.info(`Api Gateway Server is running on PORT:${PORT}`);
});
