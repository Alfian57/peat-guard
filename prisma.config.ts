import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    ...(process.env.PEATGUARD_FRESH_RESET === "1"
      ? {}
      : { seed: "bun run db:seed" }),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
