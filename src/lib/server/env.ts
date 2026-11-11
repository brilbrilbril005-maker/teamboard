import "server-only";
import { z } from "zod";

/**
 * Настройки окружения. Читаются и проверяются один раз при первом
 * обращении, а при старте сервера — принудительно (см. instrumentation.ts),
 * чтобы приложение не запускалось с неверной конфигурацией.
 */

const booleanFlag = (defaultValue: boolean) =>
  z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((value) => (value === undefined ? defaultValue : value === "true" || value === "1"));

const MIN_SECRET_LENGTH = 32;
const MIN_DEMO_PASSWORD_LENGTH = 8;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Строка подключения к PostgreSQL. */
  DATABASE_URL: z
    .string("DATABASE_URL не задан")
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL должен начинаться с postgres://"),
  /** Публичный адрес приложения, например https://teamboard.example.ru */
  APP_URL: z.url("APP_URL должен быть полным адресом, например https://example.ru"),
  /** Секрет для подписи сессий. Сгенерировать: openssl rand -base64 32 */
  AUTH_SECRET: z
    .string("AUTH_SECRET не задан")
    .min(MIN_SECRET_LENGTH, `AUTH_SECRET должен быть не короче ${MIN_SECRET_LENGTH} символов`),
  /** Применять миграции базы при старте сервера. */
  RUN_MIGRATIONS: booleanFlag(true),
  /** Заполнить пустую базу демо-данными при старте. Требует DEMO_PASSWORD. */
  SEED_DEMO_DATA: booleanFlag(false),
  /** Пароль демо-аккаунтов. Если не задан, вход «как демо» отключён. */
  DEMO_PASSWORD: z
    .string()
    .min(
      MIN_DEMO_PASSWORD_LENGTH,
      `DEMO_PASSWORD должен быть не короче ${MIN_DEMO_PASSWORD_LENGTH} символов`,
    )
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  // Пустая строка в .env означает «не задано».
  const defined = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ""),
  );
  const result = envSchema.safeParse(defined);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Неверные переменные окружения:\n${details}`);
  }
  return result.data;
}

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
