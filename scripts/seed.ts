/**
 * Заполнение базы демо-данными из командной строки: pnpm db:seed
 * Перед заполнением применяет миграции.
 */
import { getDb, getPool } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { seedDemoData } from "@/db/seed";
import { createAuthFor } from "@/features/auth/server";
import { getEnv } from "@/lib/server/env";

async function main(): Promise<void> {
  const password = getEnv().DEMO_PASSWORD;
  if (!password) {
    throw new Error("Задайте DEMO_PASSWORD в .env.local — это пароль демо-аккаунтов");
  }
  await runMigrations(getPool());
  const result = await seedDemoData({ db: getDb(), authFor: createAuthFor, password });
  console.info(
    result.seeded
      ? `Готово: пользователей — ${result.users}, задач — ${result.tasks}`
      : "В базе уже есть пользователи — демо-данные не добавлены",
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => getPool().end());
