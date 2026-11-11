import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

/**
 * Сквозные тесты запускают настоящую боевую сборку приложения на отдельной
 * тестовой базе PostgreSQL (имя базы обязано заканчиваться на "_e2e").
 * Локально: createdb teamboard_e2e && pnpm test:e2e
 */

const PORT = Number(process.env.E2E_PORT ?? 3200);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgres://localhost:5432/teamboard_e2e";

// Секреты тестового сервера создаются заново на каждый прогон и нигде не хранятся.
const randomSecret = () => randomBytes(32).toString("base64url");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm exec tsx scripts/e2e-reset-db.ts && pnpm build && pnpm start",
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    env: {
      NODE_ENV: "production",
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      DATABASE_URL,
      APP_URL: BASE_URL,
      AUTH_SECRET: randomSecret(),
      RUN_MIGRATIONS: "true",
      SEED_DEMO_DATA: "true",
      DEMO_PASSWORD: randomSecret(),
    },
  },
});
