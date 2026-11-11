import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { tasks, users } from "@/db/schema";
import { createTestDatabase, type TestDatabase } from "../../../../tests/helpers/test-db";
import type { TaskFilters } from "../model";
import { createTaskRepository, type NewTaskRecord, type TaskRepository } from "./repository";

const TODAY = "2026-11-11";
const YESTERDAY = "2026-11-10";
const TOMORROW = "2026-11-12";
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

let testDb: TestDatabase;
let repository: TaskRepository;
let annaId: string;
let olgaId: string;

async function insertUser(username: string, name: string): Promise<string> {
  const [row] = await testDb.db
    .insert(users)
    .values({ name, username, email: `${username}@users.teamboard.invalid` })
    .returning({ id: users.id });
  return row?.id ?? "";
}

function record(overrides: Partial<NewTaskRecord> & Pick<NewTaskRecord, "title">): NewTaskRecord {
  return {
    description: "",
    status: "new",
    priority: "medium",
    dueDate: null,
    assigneeId: null,
    creatorId: annaId,
    ...overrides,
  };
}

/** Создаёт задачи по очереди с разным временем создания: последняя — самая новая. */
async function createInOrder(records: readonly NewTaskRecord[]): Promise<string[]> {
  const ids: string[] = [];
  for (const [index, item] of records.entries()) {
    const task = await repository.create(item);
    const createdAt = new Date(Date.UTC(2026, 0, 1, 0, index));
    await testDb.db.update(tasks).set({ createdAt }).where(eq(tasks.id, task.id));
    ids.push(task.id);
  }
  return ids;
}

async function titles(filters: TaskFilters = {}): Promise<string[]> {
  const list = await repository.list(filters, TODAY);
  return list.map((task) => task.title);
}

beforeAll(async () => {
  testDb = await createTestDatabase();
  repository = createTaskRepository(testDb.db);
  annaId = await insertUser("anna", "Анна Смирнова");
  olgaId = await insertUser("olga", "Ольга Кузнецова");
});

beforeEach(async () => {
  await testDb.db.delete(tasks);
});

afterAll(async () => {
  await testDb.close();
});

describe("task repository: create and read", () => {
  it("creates a task and returns it with the creator and assignee", async () => {
    const task = await repository.create(
      record({
        title: "Отчёт",
        description: "Собрать цифры",
        priority: "high",
        dueDate: TOMORROW,
        assigneeId: olgaId,
      }),
    );

    expect(task).toMatchObject({
      title: "Отчёт",
      description: "Собрать цифры",
      status: "new",
      priority: "high",
      dueDate: TOMORROW,
      creator: { id: annaId, username: "anna", name: "Анна Смирнова" },
      assignee: { id: olgaId, username: "olga", name: "Ольга Кузнецова" },
    });
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  it("returns a null assignee for an unassigned task", async () => {
    const task = await repository.create(record({ title: "Без ответственного" }));

    expect(task.assignee).toBeNull();
  });

  it("finds a task by id", async () => {
    const created = await repository.create(record({ title: "Найти меня" }));

    expect(await repository.findById(created.id)).toEqual(created);
  });

  it("returns null for an unknown id", async () => {
    expect(await repository.findById(UNKNOWN_ID)).toBeNull();
  });

  it("exposes only public fields of people", async () => {
    const task = await repository.create(record({ title: "Поля", assigneeId: olgaId }));

    expect(Object.keys(task.creator).sort()).toEqual(["id", "name", "username"]);
    expect(Object.keys(task.assignee ?? {}).sort()).toEqual(["id", "name", "username"]);
  });
});

describe("task repository: update and delete", () => {
  it("applies only the given changes and moves updatedAt forward", async () => {
    const created = await repository.create(record({ title: "Старое", assigneeId: olgaId }));
    const past = new Date("2026-01-01T00:00:00Z");
    await testDb.db.update(tasks).set({ updatedAt: past }).where(eq(tasks.id, created.id));

    const updated = await repository.update(created.id, { status: "done", assigneeId: null });

    expect(updated).toMatchObject({
      title: "Старое",
      status: "done",
      assignee: null,
      createdAt: created.createdAt,
    });
    expect(updated?.updatedAt.getTime()).toBeGreaterThan(past.getTime());
  });

  it("returns null when updating a missing task", async () => {
    expect(await repository.update(UNKNOWN_ID, { title: "Нет" })).toBeNull();
  });

  it("deletes a task and reports whether it existed", async () => {
    const created = await repository.create(record({ title: "Удалить" }));

    expect(await repository.delete(created.id)).toBe(true);
    expect(await repository.findById(created.id)).toBeNull();
    expect(await repository.delete(created.id)).toBe(false);
  });

  it("keeps the task without an assignee when the assignee is deleted", async () => {
    const leaverId = await insertUser("leaver", "Уходящий");
    const created = await repository.create(record({ title: "Осталась", assigneeId: leaverId }));

    await testDb.db.delete(users).where(eq(users.id, leaverId));

    expect((await repository.findById(created.id))?.assignee).toBeNull();
  });
});

describe("task repository: list sorting", () => {
  it("sorts by priority, then due date (none last), then newest first", async () => {
    await createInOrder([
      record({ title: "низкий", priority: "low", dueDate: YESTERDAY }),
      record({ title: "средний без срока", priority: "medium" }),
      record({ title: "средний завтра", priority: "medium", dueDate: TOMORROW }),
      record({ title: "средний сегодня", priority: "medium", dueDate: TODAY }),
      record({ title: "высокий старый", priority: "high" }),
      record({ title: "высокий новый", priority: "high" }),
    ]);

    expect(await titles()).toEqual([
      "высокий новый",
      "высокий старый",
      "средний сегодня",
      "средний завтра",
      "средний без срока",
      "низкий",
    ]);
  });
});

describe("task repository: list filters", () => {
  beforeEach(async () => {
    await createInOrder([
      record({
        title: "Отчёт для клиента",
        description: "Собрать цифры",
        status: "in_progress",
        priority: "high",
        dueDate: YESTERDAY,
        assigneeId: annaId,
      }),
      record({
        title: "Макеты",
        description: "Согласовать отчёт с дизайнером",
        status: "done",
        priority: "low",
        dueDate: YESTERDAY,
        assigneeId: olgaId,
      }),
      record({ title: "Скидка 100%", description: "a_b", status: "new", dueDate: TOMORROW }),
      record({ title: "Путь C:\\temp", status: "new", priority: "low", dueDate: TODAY }),
    ]);
  });

  it("searches the title and the description case-insensitively", async () => {
    expect(await titles({ search: "ОТЧЁТ" })).toEqual(["Отчёт для клиента", "Макеты"]);
  });

  it("treats % and _ in the search as plain characters", async () => {
    expect(await titles({ search: "100%" })).toEqual(["Скидка 100%"]);
    expect(await titles({ search: "%" })).toEqual(["Скидка 100%"]);
    expect(await titles({ search: "_" })).toEqual(["Скидка 100%"]);
  });

  it("treats a backslash in the search as a plain character", async () => {
    expect(await titles({ search: "C:\\t" })).toEqual(["Путь C:\\temp"]);
  });

  it("filters by several statuses", async () => {
    expect(await titles({ statuses: ["new", "done"] })).toEqual([
      "Скидка 100%",
      "Макеты",
      "Путь C:\\temp",
    ]);
  });

  it("filters by priority", async () => {
    expect(await titles({ priorities: ["low"] })).toEqual(["Макеты", "Путь C:\\temp"]);
  });

  it("ignores empty status and priority lists", async () => {
    expect(await titles({ statuses: [], priorities: [] })).toHaveLength(4);
  });

  it("filters by a team member", async () => {
    expect(await titles({ assignee: { kind: "member", id: olgaId } })).toEqual(["Макеты"]);
  });

  it("filters tasks without an assignee", async () => {
    expect(await titles({ assignee: { kind: "unassigned" } })).toEqual([
      "Скидка 100%",
      "Путь C:\\temp",
    ]);
  });

  it("shows only overdue tasks: due before today and not done", async () => {
    expect(await titles({ overdueOnly: true })).toEqual(["Отчёт для клиента"]);
  });

  it("combines filters", async () => {
    expect(await titles({ search: "отчёт", statuses: ["done"], priorities: ["low"] })).toEqual([
      "Макеты",
    ]);
  });
});

describe("task repository: counters", () => {
  it("counts all tasks and tasks per assignee", async () => {
    await createInOrder([
      record({ title: "1", assigneeId: annaId }),
      record({ title: "2", assigneeId: annaId, status: "done" }),
      record({ title: "3", assigneeId: olgaId }),
      record({ title: "4" }),
    ]);

    expect(await repository.countAll()).toBe(4);
    expect(await repository.countByAssignee()).toEqual({ [annaId]: 2, [olgaId]: 1 });
  });

  it("returns zeros for an empty board", async () => {
    expect(await repository.countAll()).toBe(0);
    expect(await repository.countByAssignee()).toEqual({});
  });
});
