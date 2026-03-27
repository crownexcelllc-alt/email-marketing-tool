require("dotenv").config();

const { createApp } = require("./src/app");
const { connectDatabase } = require("./src/config/database");
const { env, assertRequiredEnvVars } = require("./src/config/env");

async function bootstrap() {
  assertRequiredEnvVars();

  await connectDatabase();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
