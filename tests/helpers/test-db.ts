import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";
import type { Database } from "@/db/types";

export type TestDatabase = {
  readonly db: Database;
  close(): Promise<void>;
};

/**
 * Чистая база для теста: настоящий PostgreSQL, работающий в памяти процесса.
 * Структура создаётся теми же миграциями, что и на сервере, — значит,
 * тесты заодно проверяют сами миграции. Docker для тестов не нужен.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, "../../drizzle") });
  return {
    db,
    close: () => client.close(),
  };
}
