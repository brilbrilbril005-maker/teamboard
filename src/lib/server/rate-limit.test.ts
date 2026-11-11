import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RateLimitedError } from "@/lib/errors";
import { createTestDatabase, type TestDatabase } from "../../../tests/helpers/test-db";
import { createRateLimiter, type RateLimiter, type RateLimitRule } from "./rate-limit";

const RULE: RateLimitRule = { limit: 3, windowSeconds: 60 };
const START = new Date("2026-11-11T10:00:00.000Z");
const secondsLater = (seconds: number) => new Date(START.getTime() + seconds * 1000);

let testDb: TestDatabase;
let limiter: RateLimiter;

beforeAll(async () => {
  testDb = await createTestDatabase();
  limiter = createRateLimiter(testDb.db);
});

afterAll(async () => {
  await testDb.close();
});

describe("rate limiter", () => {
  it("allows attempts up to the limit", async () => {
    for (let attempt = 0; attempt < RULE.limit; attempt += 1) {
      await expect(limiter.consume("allow", RULE, START)).resolves.toBeUndefined();
    }
  });

  it("rejects the attempt over the limit and reports when to retry", async () => {
    for (let attempt = 0; attempt < RULE.limit; attempt += 1) {
      await limiter.consume("reject", RULE, START);
    }

    const error = await limiter.consume("reject", RULE, secondsLater(20)).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfterSeconds).toBe(40);
  });

  it("starts a new window once the previous one has expired", async () => {
    for (let attempt = 0; attempt <= RULE.limit; attempt += 1) {
      await limiter.consume("expire", RULE, START).catch(() => undefined);
    }

    await expect(limiter.consume("expire", RULE, secondsLater(61))).resolves.toBeUndefined();
  });

  it("counts keys independently", async () => {
    for (let attempt = 0; attempt <= RULE.limit; attempt += 1) {
      await limiter.consume("key-a", RULE, START).catch(() => undefined);
    }

    await expect(limiter.consume("key-b", RULE, START)).resolves.toBeUndefined();
  });

  it("clears the counter on reset", async () => {
    for (let attempt = 0; attempt <= RULE.limit; attempt += 1) {
      await limiter.consume("reset", RULE, START).catch(() => undefined);
    }

    await limiter.reset("reset");

    await expect(limiter.consume("reset", RULE, START)).resolves.toBeUndefined();
  });

  it("does not let parallel attempts slip past the limit", async () => {
    const attempts = Array.from({ length: 10 }, () =>
      limiter.consume("parallel", RULE, START).then(
        () => "allowed" as const,
        () => "rejected" as const,
      ),
    );

    const outcomes = await Promise.all(attempts);

    expect(outcomes.filter((outcome) => outcome === "allowed")).toHaveLength(RULE.limit);
  });
});
