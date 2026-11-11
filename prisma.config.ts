import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    ...(process.env.PEATGUARD_FRESH_RESET === "1"
      ? {}
      : { seed: "bun run db:seed" }),
  },
  datasource: {
    url:
      process.env.DATABASE_URL?.trim() ||
      "postgresql://postgres:postgres@localhost:5432/peat_guard?schema=public",
  },
});
