/** Применение миграций из командной строки: pnpm db:migrate */
import { getPool } from "@/db/client";
import { runMigrations } from "@/db/migrate";

runMigrations(getPool())
  .then(() => console.info("Миграции применены"))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => getPool().end());
