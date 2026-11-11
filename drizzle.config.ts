import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    // Нужна только командам, которые ходят в базу (studio, push). Для generate не требуется.
    url: process.env.DATABASE_URL ?? "",
  },
});
