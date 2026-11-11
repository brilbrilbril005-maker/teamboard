import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { tasks, users } from "@/db/schema";
import type { CurrentUser } from "@/features/auth/model";
import { createUserRepository } from "@/features/users/server/repository";
import { todayIso } from "@/lib/dates";
import { AppError, RateLimitedError } from "@/lib/errors";
import type { RateLimiter, RateLimitRule } from "@/lib/server/rate-limit";
import { createTestDatabase, type TestDatabase } from "../../../../tests/helpers/test-db";
import { createTaskRepository, type TaskRepository } from "./repository";
import { createTaskService, TASK_MUTATION_RATE_LIMIT, type TaskService } from "./service";

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";
/** В UTC ещё 11 ноября (21:30), а в Москве уже 12-е (00:30). */
const NOW = new Date("2026-11-11T21:30:00Z");

let testDb: TestDatabase;
let anna: CurrentUser;
let olga: CurrentUser;
let consumed: { key: string; rule: RateLimitRule }[];
let service: TaskService;

const recordingRateLimiter: RateLimiter = {
  async consume(key, rule) {
    consumed.push({ key, rule });
  },
  async reset() {},
  async purgeStale() {
    return 0;
  },
};

function buildService(rateLimiter: RateLimiter = recordingRateLimiter): TaskService {
  return createTaskService({
    taskRepository: createTaskRepository(testDb.db),
    userRepository: createUserRepository(testDb.db),
    rateLimiter,
    now: () => NOW,
  });
}

async function insertUser(username: string, name: string): Promise<CurrentUser> {
  const [row] = await testDb.db
    .insert(users)
    .values({ name, username, email: `${username}@users.teamboard.invalid` })
    .returning({ id: users.id });
  return { id: row?.id ?? "", name, username };
}

async function expectAppError(
  promise: Promise<unknown>,
  expected: { code: AppError["code"]; message: string; fieldErrors?: AppError["fieldErrors"] },
): Promise<void> {
  const error: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(AppError);
  expect(error).toMatchObject(expected);
}

beforeAll(async () => {
  testDb = await createTestDatabase();
  anna = await insertUser("anna", "Анна Смирнова");
  olga = await insertUser("olga", "Ольга Кузнецова");
});

beforeEach(async () => {
  await testDb.db.delete(tasks);
  consumed = [];
  service = buildService();
});

afterAll(async () => {
  await testDb.close();
});

describe("task service: create", () => {
  it("creates a task with the current user as the author", async () => {
    const task = await service.createTask(anna, {
      title: "Отчёт",
      description: "",
      status: "new",
      priority: "high",
      dueDate: "2026-11-20",
      assigneeId: olga.id,
    });

    expect(task).toMatchObject({ title: "Отчёт", creator: anna, assignee: olga });
  });

  it("rejects an assignee who is not on the team", async () => {
    await expectAppError(
      service.createTask(anna, {
        title: "Отчёт",
        description: "",
        status: "new",
        priority: "medium",
        dueDate: null,
        assigneeId: UNKNOWN_ID,
      }),
      {
        code: "VALIDATION",
        message: "Участник не найден",
        fieldErrors: { assigneeId: ["Участник не найден"] },
      },
    );
  });
});

describe("task service: read", () => {
  it("returns a task by id", async () => {
    const created = await service.createTask(anna, minimalTask("Найти"));

    expect(await service.getTask(created.id)).toEqual(created);
  });

  it("reports a missing task", async () => {
    await expectAppError(service.getTask(UNKNOWN_ID), {
      code: "NOT_FOUND",
      message: "Задача не найдена",
    });
  });

  it("counts overdue tasks by the team's today, not by the server clock", async () => {
    await service.createTask(anna, { ...minimalTask("Срок 11-го"), dueDate: "2026-11-11" });
    await service.createTask(anna, { ...minimalTask("Срок 12-го"), dueDate: "2026-11-12" });

    const overdue = await service.listTasks({ overdueOnly: true });

    // В Москве уже 12 ноября, значит задача со сроком 11-го просрочена.
    expect(overdue.map((task) => task.title)).toEqual(["Срок 11-го"]);
  });

  it("builds the board: filtered tasks, unfiltered counters and today", async () => {
    await service.createTask(anna, { ...minimalTask("Анне"), assigneeId: anna.id });
    await service.createTask(anna, { ...minimalTask("Ольге"), assigneeId: olga.id });
    await service.createTask(olga, minimalTask("Никому"));

    const board = await service.getTaskBoard({ assignee: { kind: "member", id: olga.id } });

    expect(board).toEqual({
      tasks: [expect.objectContaining({ title: "Ольге" })],
      total: 3,
      countsByAssignee: { [anna.id]: 1, [olga.id]: 1 },
      today: "2026-11-12",
    });
  });
});

describe("task service: update", () => {
  it("lets any team member change a task", async () => {
    const created = await service.createTask(anna, minimalTask("Чужая"));

    const updated = await service.updateTask(olga, {
      id: created.id,
      changes: { title: "Переименована", assigneeId: olga.id },
    });

    expect(updated).toMatchObject({ title: "Переименована", assignee: olga, creator: anna });
  });

  it("changes only the status as a special case of update", async () => {
    const created = await service.createTask(anna, minimalTask("Статус"));

    const updated = await service.updateTask(anna, {
      id: created.id,
      changes: { status: "done" },
    });

    expect(updated).toMatchObject({ title: "Статус", status: "done" });
  });

  it("reports a missing task", async () => {
    await expectAppError(
      service.updateTask(anna, { id: UNKNOWN_ID, changes: { status: "done" } }),
      { code: "NOT_FOUND", message: "Задача не найдена" },
    );
  });

  it("rejects an assignee who is not on the team", async () => {
    const created = await service.createTask(anna, minimalTask("Ответственный"));

    await expectAppError(
      service.updateTask(anna, { id: created.id, changes: { assigneeId: UNKNOWN_ID } }),
      {
        code: "VALIDATION",
        fieldErrors: { assigneeId: ["Участник не найден"] },
        message: "Участник не найден",
      },
    );
  });

  it("allows removing the assignee", async () => {
    const created = await service.createTask(anna, {
      ...minimalTask("Снять"),
      assigneeId: olga.id,
    });

    const updated = await service.updateTask(anna, {
      id: created.id,
      changes: { assigneeId: null },
    });

    expect(updated.assignee).toBeNull();
  });
});

describe("task service: delete", () => {
  it("lets the author delete a task", async () => {
    const created = await service.createTask(anna, minimalTask("Удалить"));

    expect(await service.deleteTask(anna, created.id)).toEqual({ id: created.id });
    await expectAppError(service.getTask(created.id), {
      code: "NOT_FOUND",
      message: "Задача не найдена",
    });
  });

  it("forbids deleting someone else's task", async () => {
    const created = await service.createTask(anna, minimalTask("Не твоя"));

    await expectAppError(service.deleteTask(olga, created.id), {
      code: "FORBIDDEN",
      message: "Удалить задачу может только её автор",
    });
    expect(await service.getTask(created.id)).toMatchObject({ id: created.id });
  });

  it("reports a missing task", async () => {
    await expectAppError(service.deleteTask(anna, UNKNOWN_ID), {
      code: "NOT_FOUND",
      message: "Задача не найдена",
    });
  });
});

describe("task service: races and defaults", () => {
  /** Репозиторий, у которого задачу «удалили» между проверкой и сохранением. */
  function withVanishingTask(overrides: Partial<TaskRepository>): TaskService {
    return createTaskService({
      taskRepository: { ...createTaskRepository(testDb.db), ...overrides },
      userRepository: createUserRepository(testDb.db),
      rateLimiter: recordingRateLimiter,
      now: () => NOW,
    });
  }

  it("reports a task deleted while it was being updated", async () => {
    const created = await service.createTask(anna, minimalTask("Исчезнет"));
    const racing = withVanishingTask({ update: async () => null });

    await expectAppError(racing.updateTask(anna, { id: created.id, changes: { title: "Новое" } }), {
      code: "NOT_FOUND",
      message: "Задача не найдена",
    });
  });

  it("reports a task deleted by someone else at the same moment", async () => {
    const created = await service.createTask(anna, minimalTask("Исчезнет"));
    const racing = withVanishingTask({ delete: async () => false });

    await expectAppError(racing.deleteTask(anna, created.id), {
      code: "NOT_FOUND",
      message: "Задача не найдена",
    });
  });

  it("uses the real clock by default", async () => {
    const realClock = createTaskService({
      taskRepository: createTaskRepository(testDb.db),
      userRepository: createUserRepository(testDb.db),
      rateLimiter: recordingRateLimiter,
    });

    expect((await realClock.getTaskBoard({})).today).toBe(todayIso());
  });
});

describe("task service: rate limit", () => {
  it("counts every change against the user's limit", async () => {
    const created = await service.createTask(anna, minimalTask("Лимит"));
    await service.updateTask(olga, { id: created.id, changes: { status: "done" } });
    await service.deleteTask(anna, created.id);

    expect(consumed).toEqual([
      { key: `tasks:mutate:${anna.id}`, rule: TASK_MUTATION_RATE_LIMIT },
      { key: `tasks:mutate:${olga.id}`, rule: TASK_MUTATION_RATE_LIMIT },
      { key: `tasks:mutate:${anna.id}`, rule: TASK_MUTATION_RATE_LIMIT },
    ]);
  });

  it("stops changes when the limit is exceeded", async () => {
    const limited = buildService({
      ...recordingRateLimiter,
      async consume() {
        throw new RateLimitedError(30);
      },
    });

    await expect(limited.createTask(anna, minimalTask("Слишком часто"))).rejects.toBeInstanceOf(
      RateLimitedError,
    );
    expect(await service.listTasks({})).toEqual([]);
  });

  it("does not limit reading", async () => {
    await service.listTasks({});
    await service.getTaskBoard({});

    expect(consumed).toEqual([]);
  });
});

function minimalTask(title: string) {
  return {
    title,
    description: "",
    status: "new",
    priority: "medium",
    dueDate: null,
    assigneeId: null,
  } as const;
}
