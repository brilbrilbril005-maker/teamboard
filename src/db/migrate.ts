import "server-only";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool } from "pg";
import { LOCKS, withAdvisoryLock } from "./lock";

export function getMigrationsFolder(): string {
  return process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");
}

/**
 * Применяет недостающие миграции. Блокировка на уровне базы гарантирует,
 * что при одновременном старте нескольких копий сервера миграции выполнит одна.
 */
export async function runMigrations(pool: Pool): Promise<void> {
  await withAdvisoryLock(pool, LOCKS.migrations, () =>
    migrate(drizzle(pool), { migrationsFolder: getMigrationsFolder() }),
  );
}
