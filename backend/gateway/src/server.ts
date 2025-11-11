import { server } from "./app.js";
import { logger } from "./utils/logger.js";
import { config } from "dotenv";

config({
  override: true,
});

const PORT = process.env.PORT!;

server.listen(PORT, () => {
  logger.info(`Api Gateway Server is running on PORT:${PORT}`);
});
