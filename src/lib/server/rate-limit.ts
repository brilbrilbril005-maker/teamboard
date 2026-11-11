import "server-only";
import { eq, lt, sql } from "drizzle-orm";
import { rateLimits } from "@/db/schema";
import type { Database } from "@/db/types";
import { RateLimitedError } from "@/lib/errors";

const MS_IN_SECOND = 1000;
/** Счётчики старше суток заведомо неактуальны: самое длинное окно — час. */
const STALE_AFTER_MS = 24 * 60 * 60 * MS_IN_SECOND;
/** Примерно каждый сотый вызов заодно убирает устаревшие счётчики. */
const PURGE_PROBABILITY = 0.01;

export type RateLimitRule = {
  /** Сколько попыток разрешено за окно. */
  readonly limit: number;
  /** Длина окна в секундах. */
  readonly windowSeconds: number;
};

export type RateLimiter = {
  /** Засчитывает попытку. Если лимит превышен — бросает RateLimitedError. */
  consume(key: string, rule: RateLimitRule, now?: Date): Promise<void>;
  /** Сбрасывает счётчик, например после успешного входа. */
  reset(key: string): Promise<void>;
  /** Удаляет устаревшие счётчики, чтобы таблица не росла бесконечно. Возвращает число удалённых. */
  purgeStale(now?: Date): Promise<number>;
};

/**
 * Ограничитель попыток с фиксированным окном. Счётчик увеличивается одним
 * запросом к базе, поэтому параллельные попытки не могут «проскочить» лимит.
 */
export function createRateLimiter(db: Database): RateLimiter {
  async function purgeStale(now = new Date()): Promise<number> {
    const staleBefore = new Date(now.getTime() - STALE_AFTER_MS);
    const deleted = await db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStartedAt, staleBefore))
      .returning({ key: rateLimits.key });
    return deleted.length;
  }

  return {
    purgeStale,

    async consume(key, rule, now = new Date()) {
      if (Math.random() < PURGE_PROBABILITY) {
        await purgeStale(now);
      }

      const windowMs = rule.windowSeconds * MS_IN_SECOND;
      const nowIso = now.toISOString();
      const expiredBeforeIso = new Date(now.getTime() - windowMs).toISOString();
      const isExpired = sql`${rateLimits.windowStartedAt} <= ${expiredBeforeIso}::timestamptz`;

      const [row] = await db
        .insert(rateLimits)
        .values({ key, count: 1, windowStartedAt: now })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            count: sql`case when ${isExpired} then 1 else ${rateLimits.count} + 1 end`,
            windowStartedAt: sql`case when ${isExpired} then ${nowIso}::timestamptz else ${rateLimits.windowStartedAt} end`,
          },
        })
        .returning();

      if (row && row.count > rule.limit) {
        const windowEndsAt = row.windowStartedAt.getTime() + windowMs;
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((windowEndsAt - now.getTime()) / MS_IN_SECOND),
        );
        throw new RateLimitedError(retryAfterSeconds);
      }
    },

    async reset(key) {
      await db.delete(rateLimits).where(eq(rateLimits.key, key));
    },
  };
}
