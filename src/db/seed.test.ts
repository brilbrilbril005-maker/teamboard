import { count } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Auth } from "@/features/auth/server/auth";
import { createAuthService } from "@/features/auth/server/service";
import { isTaskOverdue } from "@/features/tasks/model";
import { todayIso } from "@/lib/dates";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { createRequestContext, createTestAuth } from "../../tests/helpers/test-auth";
import { createTestDatabase, type TestDatabase } from "../../tests/helpers/test-db";
import { sessions, tasks, users } from "./schema";
import type { Database } from "./types";
import { seedDemoData } from "./seed";

const PASSWORD = "demo-password-123";
const NOW = new Date("2026-11-11T09:00:00.000Z");

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb.close();
});

describe("seedDemoData", () => {
  it("leaves the database empty when seeding fails halfway", async () => {
    const brokenAuthFor = (db: Database): Auth => {
      const auth = createTestAuth(db);
      let calls = 0;
      const signUpEmail: Auth["api"]["signUpEmail"] = ((
        ...args: Parameters<Auth["api"]["signUpEmail"]>
      ) => {
        calls += 1;
        if (calls === 3) {
          throw new Error("simulated failure on the third user");
        }
        return auth.api.signUpEmail(...args);
      }) as Auth["api"]["signUpEmail"];
      return { ...auth, api: { ...auth.api, signUpEmail } };
    };

    await expect(
      seedDemoData({ db: testDb.db, authFor: brokenAuthFor, password: PASSWORD, now: NOW }),
    ).rejects.toThrow("simulated failure");

    const [userCount] = await testDb.db.select({ value: count() }).from(users);
    expect(userCount?.value).toBe(0);
  });

  it("creates demo users and tasks in an empty database", async () => {
    const result = await seedDemoData({
      db: testDb.db,
      authFor: createTestAuth,
      password: PASSWORD,
      now: NOW,
    });

    expect(result).toEqual({ seeded: true, users: 4, tasks: 9 });
  });

  it("covers every status and includes an overdue task", async () => {
    const rows = await testDb.db.select().from(tasks);
    const today = todayIso(NOW);

    expect(new Set(rows.map((row) => row.status))).toEqual(new Set(["new", "in_progress", "done"]));
    expect(rows.some((row) => isTaskOverdue(row, today))).toBe(true);
  });

  it("leaves no open sessions behind", async () => {
    const [row] = await testDb.db.select({ value: count() }).from(sessions);

    expect(row?.value).toBe(0);
  });

  it("lets the demo user sign in with the demo password", async () => {
    const service = createAuthService({
      auth: createTestAuth(testDb.db),
      rateLimiter: createRateLimiter(testDb.db),
      demoPassword: PASSWORD,
    });

    const user = await service.signInAsDemo(createRequestContext());

    expect(user).toMatchObject({ username: "anna", name: "Анна Смирнова" });
  });

  it("does nothing when the database already has users", async () => {
    const result = await seedDemoData({
      db: testDb.db,
      authFor: createTestAuth,
      password: PASSWORD,
      now: NOW,
    });
    const [row] = await testDb.db.select({ value: count() }).from(users);

    expect(result.seeded).toBe(false);
    expect(row?.value).toBe(4);
  });
});
