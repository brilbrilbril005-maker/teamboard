import "server-only";
import { createAuthFor } from "@/features/auth/server";
import { getEnv } from "@/lib/server/env";
import { logger } from "@/lib/server/logger";
import { getDb, getPool } from "./client";
import { LOCKS, withAdvisoryLock } from "./lock";
import { runMigrations } from "./migrate";
import { seedDemoData } from "./seed";

const SCOPE = "bootstrap";

/**
 * Подготовка при старте сервера: проверяем настройки, применяем миграции и
 * (если включено) заполняем пустую базу демо-данными. Вызывается один раз
 * из instrumentation.ts до того, как сервер начнёт принимать запросы.
 */
export async function prepareDatabase(): Promise<void> {
  const env = getEnv();

  if (env.RUN_MIGRATIONS) {
    await runMigrations(getPool());
    logger.info(SCOPE, "миграции применены");
  }

  if (!env.SEED_DEMO_DATA) {
    return;
  }
  if (!env.DEMO_PASSWORD) {
    logger.warn(SCOPE, "SEED_DEMO_DATA включён, но DEMO_PASSWORD не задан — демо-данные пропущены");
    return;
  }
  const password = env.DEMO_PASSWORD;
  // Под блокировкой: вторая копия сервера дождётся первой и увидит, что база уже заполнена.
  const result = await withAdvisoryLock(getPool(), LOCKS.demoSeed, () =>
    seedDemoData({ db: getDb(), authFor: createAuthFor, password }),
  );
  logger.info(
    SCOPE,
    result.seeded ? "демо-данные созданы" : "база не пуста — демо-данные пропущены",
    {
      users: result.users,
      tasks: result.tasks,
    },
  );
}
