import { describe, expect, it } from "vitest";
import { TASK_TITLE_MAX_LENGTH } from "./model";
import {
  changeTaskStatusSchema,
  createTaskSchema,
  parseTaskFilters,
  serializeTaskFilters,
  taskFiltersToQuery,
  updateTaskSchema,
} from "./schemas";
import type { TaskFilters } from "./model";

const TASK_ID = "7b0f4f0e-6d5c-4c59-9b0a-3f2f8f1f6a11";
const USER_ID = "0a9d9d6e-1f0b-4f6e-8d57-2c1c4f7b9e22";

describe("createTaskSchema", () => {
  it("fills defaults when only a title is given", () => {
    expect(createTaskSchema.parse({ title: "  Написать отчёт " })).toEqual({
      title: "Написать отчёт",
      description: "",
      status: "new",
      priority: "medium",
      dueDate: null,
      assigneeId: null,
    });
  });

  it("rejects text with a NUL character instead of failing in the database", () => {
    const result = createTaskSchema.safeParse({ title: "a\u0000b", description: "c\u0000" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
      "title",
      "description",
    ]);
  });

  it("rejects a blank title", () => {
    expect(createTaskSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("rejects a title over the limit", () => {
    expect(
      createTaskSchema.safeParse({ title: "a".repeat(TASK_TITLE_MAX_LENGTH + 1) }).success,
    ).toBe(false);
  });

  it.each(["11.11.2026", "2026-13-01", "2026-02-30", "завтра"])(
    "rejects the malformed date %s",
    (dueDate) => {
      expect(createTaskSchema.safeParse({ title: "a", dueDate }).success).toBe(false);
    },
  );

  it("rejects unknown status and priority values", () => {
    expect(createTaskSchema.safeParse({ title: "a", status: "archived" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: "a", priority: "urgent" }).success).toBe(false);
  });

  it("rejects an assignee that is not an identifier", () => {
    expect(createTaskSchema.safeParse({ title: "a", assigneeId: "anna" }).success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("accepts a partial change", () => {
    const parsed = updateTaskSchema.parse({ id: TASK_ID, changes: { assigneeId: USER_ID } });

    expect(parsed.changes).toEqual({ assigneeId: USER_ID });
  });

  it("allows clearing the assignee and the due date", () => {
    const parsed = updateTaskSchema.parse({
      id: TASK_ID,
      changes: { assigneeId: null, dueDate: null },
    });

    expect(parsed.changes).toEqual({ assigneeId: null, dueDate: null });
  });

  it("rejects an update without changes", () => {
    expect(updateTaskSchema.safeParse({ id: TASK_ID, changes: {} }).success).toBe(false);
  });

  it("drops fields that must not be changed by the client", () => {
    const parsed = updateTaskSchema.parse({
      id: TASK_ID,
      changes: { title: "Новое", creatorId: USER_ID } as { title: string },
    });

    expect(parsed.changes).toEqual({ title: "Новое" });
  });

  it("rejects a malformed task id", () => {
    expect(updateTaskSchema.safeParse({ id: "1", changes: { title: "a" } }).success).toBe(false);
  });
});

describe("changeTaskStatusSchema", () => {
  it("accepts a known status", () => {
    expect(changeTaskStatusSchema.parse({ id: TASK_ID, status: "done" })).toEqual({
      id: TASK_ID,
      status: "done",
    });
  });

  it("rejects an unknown status", () => {
    expect(changeTaskStatusSchema.safeParse({ id: TASK_ID, status: "closed" }).success).toBe(false);
  });
});

describe("parseTaskFilters", () => {
  it("returns no filters for an empty address", () => {
    expect(parseTaskFilters({})).toEqual({});
  });

  it("reads every filter from the address", () => {
    expect(
      parseTaskFilters({
        q: "  отчёт ",
        status: "new,in_progress",
        priority: "high",
        assignee: USER_ID,
        overdue: "1",
      }),
    ).toEqual({
      search: "отчёт",
      statuses: ["new", "in_progress"],
      priorities: ["high"],
      assignee: { kind: "member", id: USER_ID },
      overdueOnly: true,
    });
  });

  it("supports the «unassigned» filter", () => {
    expect(parseTaskFilters({ assignee: "none" })).toEqual({ assignee: { kind: "unassigned" } });
  });

  it("silently drops unknown and malformed values", () => {
    expect(
      parseTaskFilters({
        status: "new,archived,new",
        priority: "urgent",
        assignee: "'; drop table tasks",
        overdue: "yes",
      }),
    ).toEqual({ statuses: ["new"] });
  });

  it("uses the first value when a parameter is repeated", () => {
    expect(parseTaskFilters({ q: ["первый", "второй"] })).toEqual({ search: "первый" });
  });

  it("takes only the first value when a list filter is repeated", () => {
    expect(parseTaskFilters({ status: ["new", "done"] })).toEqual({ statuses: ["new"] });
  });

  it("removes characters the database cannot store from the search", () => {
    expect(parseTaskFilters({ q: "от\u0000чёт" })).toEqual({ search: "отчёт" });
  });

  it("limits the search length", () => {
    expect(parseTaskFilters({ q: "a".repeat(500) }).search).toHaveLength(100);
  });
});

describe("serializeTaskFilters", () => {
  it("writes nothing for empty filters", () => {
    expect(serializeTaskFilters({})).toEqual({});
    expect(taskFiltersToQuery({})).toBe("");
  });

  it("writes every filter in the address format", () => {
    expect(
      serializeTaskFilters({
        search: "отчёт",
        statuses: ["new", "in_progress"],
        priorities: ["high"],
        assignee: { kind: "member", id: USER_ID },
        overdueOnly: true,
      }),
    ).toEqual({
      q: "отчёт",
      status: "new,in_progress",
      priority: "high",
      assignee: USER_ID,
      overdue: "1",
    });
  });

  it("writes the «unassigned» filter as none", () => {
    expect(serializeTaskFilters({ assignee: { kind: "unassigned" } })).toEqual({
      assignee: "none",
    });
  });

  it("skips empty lists, a blank search and a disabled overdue flag", () => {
    expect(
      serializeTaskFilters({ search: "  ", statuses: [], priorities: [], overdueOnly: false }),
    ).toEqual({});
  });

  it("builds an encoded query string for links", () => {
    expect(taskFiltersToQuery({ search: "a&b", statuses: ["new", "done"] })).toBe(
      "?q=a%26b&status=new%2Cdone",
    );
  });

  it.each<[string, TaskFilters]>([
    ["no filters", {}],
    ["search with special characters", { search: "100% & a_b, ?=#" }],
    ["statuses", { statuses: ["done", "new"] }],
    ["priorities", { priorities: ["low", "medium", "high"] }],
    ["member", { assignee: { kind: "member", id: USER_ID } }],
    ["unassigned", { assignee: { kind: "unassigned" } }],
    ["overdue", { overdueOnly: true }],
    [
      "everything",
      {
        search: "отчёт",
        statuses: ["in_progress"],
        priorities: ["high"],
        assignee: { kind: "unassigned" },
        overdueOnly: true,
      },
    ],
  ])("round-trips through the address: %s", (_name, filters) => {
    expect(parseTaskFilters(serializeTaskFilters(filters))).toEqual(filters);

    const query = new URLSearchParams(taskFiltersToQuery(filters));
    expect(parseTaskFilters(Object.fromEntries(query))).toEqual(filters);
  });
});
