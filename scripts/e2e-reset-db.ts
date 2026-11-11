/**
 * Очищает базу перед сквозными тестами, чтобы каждый прогон начинался с нуля.
 * Предохранитель: работает только с базой, имя которой заканчивается на "_e2e", —
 * случайно стереть рабочую базу этим скриптом невозможно.
 */
import { Client } from "pg";

const E2E_DATABASE_SUFFIX = "_e2e";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL не задан");
  }
  const databaseName = new URL(url).pathname.replace(/^\//, "");
  if (!databaseName.endsWith(E2E_DATABASE_SUFFIX)) {
    throw new Error(`Отказ: база "${databaseName}" не тестовая (имя должно заканчиваться на ${E2E_DATABASE_SUFFIX})`);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("drop schema if exists public cascade");
    await client.query("drop schema if exists drizzle cascade");
    await client.query("create schema public");
  } finally {
    await client.end();
  }
  console.info(`База ${databaseName} очищена`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
