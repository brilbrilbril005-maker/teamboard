import "server-only";

/**
 * Единая точка записи серверных событий. Пишет в стандартный вывод одной
 * строкой JSON — так журнал удобно читать и на хостинге, и в Docker.
 * В журнал не попадают пароли и содержимое запросов: только то, что передано явно.
 */

type LogContext = Readonly<Record<string, unknown>>;

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
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
