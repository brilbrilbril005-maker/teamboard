import "server-only";
import type { z } from "zod";
import { UnauthenticatedError } from "@/lib/errors";
import { createAction, type ServerAction } from "@/lib/server/action";
import type { CurrentUser } from "../model";
import { getCurrentUser } from "./session";

export type AuthedContext = { readonly user: CurrentUser };

async function requireAuthedContext(): Promise<AuthedContext> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthenticatedError();
  }
  return { user };
}

/**
 * Действие только для вошедших пользователей. Сессия проверяется на сервере
 * при каждом вызове — до разбора данных и до обращения к сервису.
 */
export function authedAction<Schema extends z.ZodType, Result>(
  name: string,
  schema: Schema,
  handler: (input: z.output<Schema>, context: AuthedContext) => Promise<Result>,
): ServerAction<Schema, Result> {
  return createAction({ name, schema, context: requireAuthedContext, handler });
}
