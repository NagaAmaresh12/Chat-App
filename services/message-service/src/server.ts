import { logger } from "./utils/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT;
app.listen(PORT, () => {
  logger.info(`Server is running on Port:${PORT}`);
});
