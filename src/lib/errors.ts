/**
 * Ошибки приложения. Сервисы и репозитории бросают их, а граница
 * (серверное действие) превращает в понятный пользователю ответ.
 * Модуль чистый: его можно импортировать и на сервере, и в браузере.
 */

export const ERROR_CODES = [
  "VALIDATION",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Ошибки по полям формы: имя поля → список сообщений. */
export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors?: FieldErrors;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { fieldErrors?: FieldErrors; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = new.target.name;
    this.code = code;
    if (options?.fieldErrors) {
      this.fieldErrors = options.fieldErrors;
    }
  }
}

export class ValidationError extends AppError {
  constructor(message = "Проверьте введённые данные", fieldErrors?: FieldErrors) {
    super("VALIDATION", message, fieldErrors ? { fieldErrors } : undefined);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Войдите в аккаунт, чтобы продолжить") {
    super("UNAUTHENTICATED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Недостаточно прав для этого действия") {
    super("FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Запись не найдена") {
    super("NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, fieldErrors?: FieldErrors) {
    super("CONFLICT", message, fieldErrors ? { fieldErrors } : undefined);
  }
}

export class RateLimitedError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("RATE_LIMITED", "Слишком много попыток. Попробуйте позже");
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export const INTERNAL_ERROR_MESSAGE = "Что-то пошло не так. Попробуйте ещё раз";
