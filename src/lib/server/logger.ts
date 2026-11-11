import "server-only";

/**
 * Единая точка записи серверных событий. Пишет в стандартный вывод одной
 * строкой JSON — так журнал удобно читать и на хостинге, и в Docker.
 * В журнал не попадают пароли и содержимое запросов: только то, что передано явно.
 */

type LogContext = Readonly<Record<string, unknown>>;

const MAX_CAUSE_DEPTH = 3;

/** Ошибка запроса к базе (Drizzle): в её тексте и стеке лежат значения параметров. */
function isQueryError(error: Error): error is Error & { query: unknown } {
  return "query" in error && "params" in error;
}

/**
 * Параметры запросов в журнал не пишутся никогда: среди них бывают токены сессий,
 * хэши паролей и логины. Для ошибок базы остаются только текст запроса
 * (с местозаполнителями) и исходная причина от драйвера.
 */
function serializeError(error: unknown, depth = 0): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }
  const cause =
    error.cause !== undefined && depth < MAX_CAUSE_DEPTH
      ? { cause: serializeError(error.cause, depth + 1) }
      : {};
  if (isQueryError(error)) {
    return {
      name: error.name,
      message: "database query failed",
      query: String(error.query),
      ...cause,
    };
  }
  const code = "code" in error && typeof error.code === "string" ? { code: error.code } : {};
  return { name: error.name, message: error.message, ...code, stack: error.stack, ...cause };
}

function write(
  level: "info" | "warn" | "error",
  scope: string,
  message: string,
  context?: LogContext,
) {
  const entry = JSON.stringify({
    time: new Date().toISOString(),
    level,
    scope,
    message,
    ...context,
  });
  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.info(entry);
  }
}

export const logger = {
  info(scope: string, message: string, context?: LogContext): void {
    write("info", scope, message, context);
  },
  warn(scope: string, message: string, context?: LogContext): void {
    write("warn", scope, message, context);
  },
  error(scope: string, error: unknown, context?: LogContext): void {
    write("error", scope, "unexpected error", { ...context, error: serializeError(error) });
  },
};
