import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  await connectDb();
  const app = createApp();
  app.listen(env.PORT, () => logger.info(`API running on http://localhost:${env.PORT}`));
}

bootstrap().catch((error) => {
  logger.error(error);
  process.exit(1);
});
