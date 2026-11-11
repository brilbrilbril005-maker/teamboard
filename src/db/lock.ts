import "server-only";
import type { Pool } from "pg";

/** Постоянные «имена» блокировок PostgreSQL (произвольные числа, главное — разные). */
export const LOCKS = {
  migrations: 727_001,
  demoSeed: 727_002,
} as const;

/** Сколько ждать блокировку, занятую другой копией сервера. */
const LOCK_TIMEOUT = "120s";

/**
 * Выполняет действие под блокировкой на уровне базы. Если несколько копий
 * сервера стартуют одновременно, действие по очереди выполнит каждая,
 * а не все сразу — миграции и демо-данные не столкнутся.
 *
 * Блокировка привязана к соединению. По окончании соединение закрывается,
 * а не возвращается в пул: так блокировка гарантированно снята даже после сбоя,
 * и ошибка самого действия не подменяется ошибкой разблокировки.
 */
export async function withAdvisoryLock<T>(
  pool: Pool,
  lockId: number,
  action: () => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    // Не ждём вечно, если другая копия зависла: лучше упасть при старте с понятной ошибкой.
    await client.query(`set lock_timeout = '${LOCK_TIMEOUT}'`);
    await client.query("select pg_advisory_lock($1)", [lockId]);
    return await action();
  } finally {
    client.release(true);
  }
}
