import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ForbiddenError, INTERNAL_ERROR_MESSAGE, UnauthenticatedError } from "@/lib/errors";
import { createAction, publicAction } from "./action";
import { logger } from "./logger";

const schema = z.object({
  title: z.string().trim().min(1, "Введите название"),
  changes: z.object({ priority: z.enum(["low", "high"], "Неизвестный приоритет") }).optional(),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createAction", () => {
  it("returns parsed data from the handler on success", async () => {
    const action = publicAction("test.ok", schema, async (input) => input.title.toUpperCase());

    const result = await action({ title: "  отчёт  " });

    expect(result).toEqual({ ok: true, data: "ОТЧЁТ" });
  });

  it("returns field errors and does not call the handler when input is invalid", async () => {
    const handler = vi.fn();
    const action = publicAction("test.invalid", schema, handler);

    const result = await action({ title: "   ", changes: { priority: "urgent" as "low" } });

    expect(handler).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Проверьте введённые данные",
        fieldErrors: {
          title: ["Введите название"],
          "changes.priority": ["Неизвестный приоритет"],
        },
      },
    });
  });

  it("checks the context before validating input", async () => {
    const handler = vi.fn();
    const action = createAction({
      name: "test.guest",
      schema,
      context: async () => {
        throw new UnauthenticatedError();
      },
      handler,
    });

    const result = await action({ title: "" });

    expect(handler).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
  });

  it("passes the context to the handler", async () => {
    const action = createAction({
      name: "test.context",
      schema,
      context: async () => ({ userId: "u1" }),
      handler: async (input, context) => `${context.userId}:${input.title}`,
    });

    expect(await action({ title: "a" })).toEqual({ ok: true, data: "u1:a" });
  });

  it("translates application errors into a failure with their message", async () => {
    const action = publicAction("test.forbidden", schema, async () => {
      throw new ForbiddenError("Удалить задачу может только автор");
    });

    const result = await action({ title: "a" });

    expect(result).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Удалить задачу может только автор" },
    });
  });

  it("hides unexpected error details from the client and logs them", async () => {
    const logSpy = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const failure = new Error("connection refused: postgres://secret@db");
    const action = publicAction("test.crash", schema, async () => {
      throw failure;
    });

    const result = await action({ title: "a" });

    expect(result).toEqual({
      ok: false,
      error: { code: "INTERNAL", message: INTERNAL_ERROR_MESSAGE },
    });
    expect(logSpy).toHaveBeenCalledWith("action:test.crash", failure);
  });

  it("lets Next.js redirects pass through", async () => {
    const { redirect } = await import("next/navigation");
    const action = publicAction("test.redirect", schema, async () => {
      redirect("/login");
    });

    await expect(action({ title: "a" })).rejects.toThrow("NEXT_REDIRECT");
  });
});
