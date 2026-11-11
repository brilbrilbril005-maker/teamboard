import "server-only";
import path from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool } from "pg";

/** Произвольное постоянное число — «имя» блокировки миграций в PostgreSQL. */
const MIGRATION_LOCK_ID = 727_001;

export function getMigrationsFolder(): string {
  return process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");
}

/**
 * Применяет недостающие миграции. Блокировка на уровне базы гарантирует,
 * что при одновременном старте нескольких копий сервера миграции выполнит одна.
 */
export async function runMigrations(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    const db = drizzle(client);
    await db.execute(sql`select pg_advisory_lock(${MIGRATION_LOCK_ID})`);
    try {
      await migrate(db, { migrationsFolder: getMigrationsFolder() });
    } finally {
      await db.execute(sql`select pg_advisory_unlock(${MIGRATION_LOCK_ID})`);
    }
  } finally {
    client.release();
  }
}
