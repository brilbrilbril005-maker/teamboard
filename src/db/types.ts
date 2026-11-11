import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * Тип подключения к базе, не привязанный к драйверу.
 * В работе это PostgreSQL через `pg`, в тестах — PGlite (PostgreSQL в памяти).
 * Репозитории принимают именно этот тип, поэтому одинаково работают в обоих случаях.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
