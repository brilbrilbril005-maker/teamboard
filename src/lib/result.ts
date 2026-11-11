import type { ErrorCode, FieldErrors } from "./errors";

/**
 * Единый формат ответа серверных действий.
 * Действия никогда не бросают исключения наружу — интерфейс всегда
 * получает либо данные, либо описание ошибки на русском.
 */
export type ActionError = {
  readonly code: ErrorCode;
  readonly message: string;
  readonly fieldErrors?: FieldErrors;
};

export type ActionResult<T = void> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: ActionError): ActionResult<never> {
  return { ok: false, error };
}
