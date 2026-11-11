import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "@/lib/server/env";
import { logger } from "@/lib/server/logger";
import * as schema from "./schema";
import type { Database } from "./types";

const POOL_MAX_CONNECTIONS = 10;
const CONNECTION_TIMEOUT_MS = 5_000;
const IDLE_TIMEOUT_MS = 30_000;

type DatabaseHandle = { readonly db: Database; readonly pool: Pool };

// В режиме разработки модули перезагружаются при каждом изменении кода.
// Храним подключение в globalThis, чтобы не плодить пулы соединений.
const globalStore = globalThis as typeof globalThis & {
  __teamboardDatabase?: DatabaseHandle;
};

function createDatabaseHandle(): DatabaseHandle {
  const pool = new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: POOL_MAX_CONNECTIONS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
  });
  // Ошибка простаивающего соединения не должна ронять процесс.
  pool.on("error", (error) => {
    logger.error("db:pool", error);
  });
  return { db: drizzle(pool, { schema }), pool };
}

function getHandle(): DatabaseHandle {
  globalStore.__teamboardDatabase ??= createDatabaseHandle();
  return globalStore.__teamboardDatabase;
}

/** Подключение создаётся при первом обращении, а не при импорте — сборка не требует базы. */
export function getDb(): Database {
  return getHandle().db;
}

export function getPool(): Pool {
  return getHandle().pool;
}
