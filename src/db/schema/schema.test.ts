import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../../../tests/helpers/test-db";
import { tasks, users } from "./index";

let testDb: TestDatabase;
let authorId: string;
let assigneeId: string;

async function insertUser(username: string): Promise<string> {
  const [row] = await testDb.db
    .insert(users)
    .values({ name: username, username, email: `${username}@users.teamboard.invalid` })
    .returning({ id: users.id });
  if (!row) {
    throw new Error("user was not inserted");
  }
  return row.id;
}

beforeAll(async () => {
  testDb = await createTestDatabase();
  authorId = await insertUser("author");
  assigneeId = await insertUser("assignee");
});

afterAll(async () => {
  await testDb.close();
});

describe("database rules for tasks", () => {
  it("applies defaults for a task created with a title only", async () => {
    const [task] = await testDb.db
      .insert(tasks)
      .values({ title: "Задача", creatorId: authorId })
      .returning();

    expect(task).toMatchObject({
      description: "",
      status: "new",
      priority: "medium",
      dueDate: null,
      assigneeId: null,
    });
  });

  it("stores the due date as a plain date", async () => {
    const [task] = await testDb.db
      .insert(tasks)
      .values({ title: "Со сроком", creatorId: authorId, dueDate: "2026-11-08" })
      .returning();

    expect(task?.dueDate).toBe("2026-11-08");
  });

  it("rejects a blank title even if the application is bypassed", async () => {
    await expect(
      testDb.db.insert(tasks).values({ title: "   ", creatorId: authorId }),
    ).rejects.toThrow();
  });

  it("rejects a task without an existing author", async () => {
    await expect(
      testDb.db
        .insert(tasks)
        .values({ title: "Чужая", creatorId: "00000000-0000-4000-8000-000000000000" }),
    ).rejects.toThrow();
  });

  it("keeps the task but clears the assignee when that user is deleted", async () => {
    const [task] = await testDb.db
      .insert(tasks)
      .values({ title: "Назначенная", creatorId: authorId, assigneeId })
      .returning({ id: tasks.id });

    await testDb.db.delete(users).where(eq(users.id, assigneeId));

    const [reloaded] = await testDb.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, task?.id ?? ""));
    expect(reloaded?.assigneeId).toBeNull();
  });

  it("refuses to delete a user who authored tasks", async () => {
    await expect(testDb.db.delete(users).where(eq(users.id, authorId))).rejects.toThrow();
  });

  it("rejects two users with the same login", async () => {
    await expect(insertUser("author")).rejects.toThrow();
  });
});
