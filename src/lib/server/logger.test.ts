import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

afterEach(() => {
  vi.restoreAllMocks();
});

function lastEntry(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  return JSON.parse(String(spy.mock.calls.at(-1)?.[0])) as Record<string, unknown>;
}

describe("logger", () => {
  it("writes info as a single JSON line with scope and context", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logger.info("bootstrap", "миграции применены", { count: 1 });

    expect(lastEntry(spy)).toMatchObject({
      level: "info",
      scope: "bootstrap",
      message: "миграции применены",
      count: 1,
    });
  });

  it("writes warnings to the warning stream", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    logger.warn("bootstrap", "пропущено");

    expect(lastEntry(spy)).toMatchObject({ level: "warn", message: "пропущено" });
  });

  it("serializes errors with name, message and stack", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logger.error("action:tasks.create", new TypeError("boom"), { userId: "u1" });

    expect(lastEntry(spy)).toMatchObject({
      level: "error",
      scope: "action:tasks.create",
      userId: "u1",
      error: { name: "TypeError", message: "boom", stack: expect.any(String) },
    });
  });

  it("serializes thrown values that are not errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logger.error("health", "connection lost");

    expect(lastEntry(spy)).toMatchObject({ error: { message: "connection lost" } });
  });

  it("never writes query parameters of a database error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const driverError = Object.assign(new Error("connection terminated"), { code: "57P01" });
    const queryError = Object.assign(
      new Error(
        "Failed query: insert into sessions (token) values ($1)\nparams: secret-session-token",
      ),
      {
        query: "insert into sessions (token) values ($1)",
        params: ["secret-session-token"],
        cause: driverError,
      },
    );

    logger.error("action:auth.signIn", queryError);

    const written = String(spy.mock.calls.at(-1)?.[0]);
    expect(written).not.toContain("secret-session-token");
    expect(lastEntry(spy)).toMatchObject({
      error: {
        message: "database query failed",
        query: "insert into sessions (token) values ($1)",
        cause: { message: "connection terminated", code: "57P01" },
      },
    });
  });
});
