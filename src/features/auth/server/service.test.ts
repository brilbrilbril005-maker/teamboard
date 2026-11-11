import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ConflictError, RateLimitedError, ValidationError } from "@/lib/errors";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { createRequestContext, createTestAuth } from "../../../../tests/helpers/test-auth";
import { createTestDatabase, type TestDatabase } from "../../../../tests/helpers/test-db";
import { accounts, users } from "@/db/schema";
import { DEMO_USERNAME } from "../model";
import {
  createAuthService,
  SIGN_IN_PER_USERNAME_RATE_LIMIT,
  SIGN_IN_RATE_LIMIT,
  SIGN_UP_RATE_LIMIT,
  type AuthService,
} from "./service";

const PASSWORD = "correct-horse-battery";
const DEMO_PASSWORD = "demo-password-123";

let testDb: TestDatabase;
let service: AuthService;

function buildService(demoPassword?: string): AuthService {
  return createAuthService({
    auth: createTestAuth(testDb.db),
    rateLimiter: createRateLimiter(testDb.db),
    demoPassword,
  });
}

beforeAll(async () => {
  testDb = await createTestDatabase();
  service = buildService(DEMO_PASSWORD);
});

afterAll(async () => {
  await testDb.close();
});

describe("auth service: sign up", () => {
  it("creates a user and returns only public fields", async () => {
    const user = await service.signUp(
      { username: "olga", name: "Ольга Кузнецова", password: PASSWORD },
      createRequestContext("198.51.100.1"),
    );

    expect(user).toEqual({ id: expect.any(String), username: "olga", name: "Ольга Кузнецова" });
  });

  it("stores the password only as a hash", async () => {
    await service.signUp(
      { username: "hashed", name: "Хэш", password: PASSWORD },
      createRequestContext("198.51.100.2"),
    );

    const rows = await testDb.db.select({ password: accounts.password }).from(accounts);

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.password).toBeTruthy();
      expect(row.password).not.toContain(PASSWORD);
    }
  });

  it("does not ask for an email and stores an undeliverable internal address", async () => {
    await service.signUp(
      { username: "nomail", name: "Без почты", password: PASSWORD },
      createRequestContext("198.51.100.3"),
    );

    const rows = await testDb.db
      .select({ email: users.email, username: users.username })
      .from(users);

    expect(rows.find((row) => row.username === "nomail")?.email).toBe(
      "nomail@users.teamboard.invalid",
    );
  });

  it("rejects a login that is already taken", async () => {
    const request = createRequestContext("198.51.100.4");
    await service.signUp({ username: "taken", name: "Первый", password: PASSWORD }, request);

    const error = await service
      .signUp({ username: "taken", name: "Второй", password: PASSWORD }, request)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConflictError);
    expect((error as ConflictError).fieldErrors).toEqual({ username: ["Этот логин уже занят"] });
  });

  it("limits the number of registrations from one address", async () => {
    const request = createRequestContext("198.51.100.5");
    for (let index = 0; index < SIGN_UP_RATE_LIMIT.limit; index += 1) {
      await service.signUp(
        { username: `bulk_${index}`, name: "Массовый", password: PASSWORD },
        request,
      );
    }

    await expect(
      service.signUp({ username: "bulk_over", name: "Лишний", password: PASSWORD }, request),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });
});

describe("auth service: sign in", () => {
  beforeAll(async () => {
    await service.signUp(
      { username: "maxim", name: "Максим Романов", password: PASSWORD },
      createRequestContext("198.51.100.6"),
    );
  });

  it("signs in with the correct login and password", async () => {
    const user = await service.signIn(
      { username: "maxim", password: PASSWORD },
      createRequestContext("198.51.100.7"),
    );

    expect(user).toMatchObject({ username: "maxim", name: "Максим Романов" });
  });

  it("gives the same answer for a wrong password and an unknown login", async () => {
    const request = createRequestContext("198.51.100.8");

    const wrongPassword = await service
      .signIn({ username: "maxim", password: "wrong-password" }, request)
      .catch((caught: unknown) => caught);
    const unknownLogin = await service
      .signIn({ username: "ghost", password: PASSWORD }, request)
      .catch((caught: unknown) => caught);

    expect(wrongPassword).toBeInstanceOf(ValidationError);
    expect(unknownLogin).toBeInstanceOf(ValidationError);
    expect((wrongPassword as ValidationError).message).toBe("Неверный логин или пароль");
    expect((unknownLogin as ValidationError).message).toBe(
      (wrongPassword as ValidationError).message,
    );
  });

  it.each(["a-b", "ab", "анна", "a".repeat(20) + "!"])(
    "answers a malformed login %s like any other wrong credentials",
    async (username) => {
      const error = await service
        .signIn({ username, password: PASSWORD }, createRequestContext("198.51.100.30"))
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toBe("Неверный логин или пароль");
    },
  );

  it("blocks further attempts after too many failures", async () => {
    const request = createRequestContext("198.51.100.9");
    for (let attempt = 0; attempt < SIGN_IN_RATE_LIMIT.limit; attempt += 1) {
      await service
        .signIn({ username: "maxim", password: "wrong-password" }, request)
        .catch(() => undefined);
    }

    await expect(
      service.signIn({ username: "maxim", password: PASSWORD }, request),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("resets the failure counter after a successful sign in", async () => {
    const request = createRequestContext("198.51.100.10");
    for (let attempt = 0; attempt < SIGN_IN_RATE_LIMIT.limit - 1; attempt += 1) {
      await service
        .signIn({ username: "maxim", password: "wrong-password" }, request)
        .catch(() => undefined);
    }
    await service.signIn({ username: "maxim", password: PASSWORD }, request);

    const afterReset = await service
      .signIn({ username: "maxim", password: "wrong-password" }, request)
      .catch((caught: unknown) => caught);

    expect(afterReset).toBeInstanceOf(ValidationError);
  });
});

describe("auth service: brute force across addresses", () => {
  it("does not spend the per-login budget on attempts already rejected by the per-address limit", async () => {
    await service.signUp(
      { username: "budget", name: "Бюджет", password: PASSWORD },
      createRequestContext("198.51.100.21"),
    );
    const noisy = createRequestContext("198.51.100.22");
    for (let attempt = 0; attempt < SIGN_IN_PER_USERNAME_RATE_LIMIT.limit + 5; attempt += 1) {
      await service
        .signIn({ username: "budget", password: "wrong-password" }, noisy)
        .catch(() => undefined);
    }

    const user = await service.signIn(
      { username: "budget", password: PASSWORD },
      createRequestContext("198.51.100.23"),
    );

    expect(user.username).toBe("budget");
  });

  it("caps attempts per login even when every attempt comes from a new address", async () => {
    await service.signUp(
      { username: "target", name: "Цель", password: PASSWORD },
      createRequestContext("198.51.100.20"),
    );
    for (let attempt = 0; attempt < SIGN_IN_PER_USERNAME_RATE_LIMIT.limit; attempt += 1) {
      await service
        .signIn(
          { username: "target", password: "wrong-password" },
          createRequestContext(`192.0.2.${attempt}`),
        )
        .catch(() => undefined);
    }

    await expect(
      service.signIn(
        { username: "target", password: PASSWORD },
        createRequestContext("192.0.2.200"),
      ),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });
});

describe("auth service: demo and session", () => {
  beforeAll(async () => {
    await service.signUp(
      { username: DEMO_USERNAME, name: "Анна Смирнова", password: DEMO_PASSWORD },
      createRequestContext("198.51.100.11"),
    );
  });

  it("signs in the demo user with the server-side password", async () => {
    const user = await service.signInAsDemo(createRequestContext("198.51.100.12"));

    expect(user.username).toBe(DEMO_USERNAME);
    expect(service.isDemoEnabled()).toBe(true);
  });

  it("keeps demo sign in available while someone hammers the demo login with wrong passwords", async () => {
    for (let attempt = 0; attempt < SIGN_IN_PER_USERNAME_RATE_LIMIT.limit + 1; attempt += 1) {
      await service
        .signIn(
          { username: DEMO_USERNAME, password: "wrong-password" },
          createRequestContext(`192.0.2.${attempt}`),
        )
        .catch(() => undefined);
    }

    const user = await service.signInAsDemo(createRequestContext("198.51.100.13"));

    expect(user.username).toBe(DEMO_USERNAME);
  });

  it("refuses demo sign in when the demo password is not configured", async () => {
    const withoutDemo = buildService(undefined);

    expect(withoutDemo.isDemoEnabled()).toBe(false);
    await expect(withoutDemo.signInAsDemo(createRequestContext())).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("returns no user for a request without a session", async () => {
    expect(await service.getCurrentUser(new Headers())).toBeNull();
  });

  it("returns no user for a forged session cookie", async () => {
    const headers = new Headers({ cookie: "teamboard.session_token=forged.signature" });

    expect(await service.getCurrentUser(headers)).toBeNull();
  });
});
