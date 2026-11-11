import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Счётчики попыток (например, входа). Хранятся в базе, а не в памяти,
 * поэтому ограничение переживает перезапуск и работает при нескольких копиях сервера.
 */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
});
