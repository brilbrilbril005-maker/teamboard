import { describe, expect, test } from "vitest";
import { ok, type ActionResult } from "@/lib/result";
import { NETWORK_ERROR_MESSAGE, runTaskMutation } from "./task-dialog-mutation";

const passThrough = <T>(promise: Promise<ActionResult<T>>) => promise;

describe("runTaskMutation", () => {
  test("возвращает ответ действия как есть", async () => {
    const result = await runTaskMutation(passThrough, () => Promise.resolve(ok(42)));

    expect(result).toEqual({ ok: true, data: 42 });
  });

  test("сбой сети превращает в понятную ошибку, а не исключение", async () => {
    const result = await runTaskMutation(passThrough, () =>
      Promise.reject(new TypeError("Failed to fetch")),
    );

    expect(result).toEqual({
      ok: false,
      error: { code: "INTERNAL", message: NETWORK_ERROR_MESSAGE },
    });
  });
});
