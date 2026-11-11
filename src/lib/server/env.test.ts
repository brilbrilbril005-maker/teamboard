import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const validEnv = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/teamboard",
  APP_URL: "https://teamboard.example.ru",
  AUTH_SECRET: "a".repeat(32),
};

describe("parseEnv", () => {
  it("accepts a minimal valid configuration and applies defaults", () => {
    const env = parseEnv(validEnv);

    expect(env.NODE_ENV).toBe("development");
    expect(env.RUN_MIGRATIONS).toBe(true);
    expect(env.SEED_DEMO_DATA).toBe(false);
    expect(env.DEMO_PASSWORD).toBeUndefined();
  });

  it("parses boolean flags written as true/false and 1/0", () => {
    const env = parseEnv({ ...validEnv, RUN_MIGRATIONS: "false", SEED_DEMO_DATA: "1" });

    expect(env.RUN_MIGRATIONS).toBe(false);
    expect(env.SEED_DEMO_DATA).toBe(true);
  });

  it("treats empty strings as not set", () => {
    const env = parseEnv({ ...validEnv, DEMO_PASSWORD: "", SEED_DEMO_DATA: "" });

    expect(env.DEMO_PASSWORD).toBeUndefined();
    expect(env.SEED_DEMO_DATA).toBe(false);
  });

  it("rejects a short auth secret", () => {
    expect(() => parseEnv({ ...validEnv, AUTH_SECRET: "short" })).toThrow(/AUTH_SECRET/);
  });

  it("rejects a database url with a wrong protocol", () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: "mysql://localhost/db" })).toThrow(/DATABASE_URL/);
  });

  it("lists every missing variable in one error", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL[\s\S]*APP_URL[\s\S]*AUTH_SECRET/);
  });

  it("rejects a demo password that is too short", () => {
    expect(() => parseEnv({ ...validEnv, DEMO_PASSWORD: "123" })).toThrow(/DEMO_PASSWORD/);
  });
});
