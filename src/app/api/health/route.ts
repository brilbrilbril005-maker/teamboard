import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { logger } from "@/lib/server/logger";

/**
 * Проверка работоспособности для хостинга и мониторинга.
 * 200 — приложение и база отвечают; 503 — база недоступна.
 */
export async function GET(): Promise<Response> {
  // Проверка выполняется при каждом запросе, а не во время сборки.
  await connection();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("health", error);
    return Response.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
