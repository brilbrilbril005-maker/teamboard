import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { AppError, INTERNAL_ERROR_MESSAGE, ValidationError, type FieldErrors } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import { logger } from "./logger";

/**
 * Каркас серверных действий. Любое действие проходит один и тот же путь:
 *   1) контекст (например, текущий пользователь);
 *   2) проверка входных данных по схеме;
 *   3) вызов сервиса;
 *   4) превращение результата или ошибки в ActionResult.
 * Благодаря этому ни одно действие не может «забыть» проверку ввода или прав.
 */

type ActionHandler<Schema extends z.ZodType, Context, Result> = (
  input: z.output<Schema>,
  context: Context,
) => Promise<Result>;

export type ServerAction<Schema extends z.ZodType, Result> = (
  input: z.input<Schema>,
) => Promise<ActionResult<Result>>;

/** Раскладывает ошибки схемы по полям: «changes.title» → ["Введите название"]. */
export function toFieldErrors(error: z.ZodError): { formErrors: string[]; fieldErrors: FieldErrors } {
  const formErrors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      formErrors.push(issue.message);
      continue;
    }
    const field = issue.path.join(".");
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }
  return { formErrors, fieldErrors };
}

export function parseInput<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }
  const { formErrors, fieldErrors } = toFieldErrors(parsed.error);
  throw new ValidationError(formErrors[0], fieldErrors);
}

function toFailure(name: string, error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return fail({
      code: error.code,
      message: error.message,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    });
  }
  // Подробности — только в журнал сервера; пользователю — общее сообщение.
  logger.error(`action:${name}`, error);
  return fail({ code: "INTERNAL", message: INTERNAL_ERROR_MESSAGE });
}

export function createAction<Schema extends z.ZodType, Context, Result>(options: {
  /** Имя для журнала, например "tasks.create". */
  readonly name: string;
  readonly schema: Schema;
  readonly context: () => Promise<Context>;
  readonly handler: ActionHandler<Schema, Context, Result>;
}): ServerAction<Schema, Result> {
  return async (input) => {
    try {
      const context = await options.context();
      const data = parseInput(options.schema, input);
      return ok(await options.handler(data, context));
    } catch (error) {
      // redirect() и notFound() в Next.js работают через исключения — пропускаем их дальше.
      unstable_rethrow(error);
      return toFailure(options.name, error);
    }
  };
}

/** Действие, доступное без входа (вход, регистрация). */
export function publicAction<Schema extends z.ZodType, Result>(
  name: string,
  schema: Schema,
  handler: (input: z.output<Schema>) => Promise<Result>,
): ServerAction<Schema, Result> {
  return createAction({ name, schema, context: async () => undefined, handler });
}
