import { describe, expect, it } from "vitest";
import type { Task } from "../model";
import { applyStatusChange, groupTasksByStatus } from "./task-grouping";

const creator = { id: "u1", username: "anna", name: "Анна Смирнова" };

function makeTask(id: string, status: Task["status"]): Task {
  return {
    id,
    title: `Задача ${id}`,
    description: "",
    status,
    priority: "medium",
    dueDate: null,
    assignee: null,
    creator,
    createdAt: new Date("2026-11-01T10:00:00Z"),
    updatedAt: new Date("2026-11-01T10:00:00Z"),
  };
}

describe("groupTasksByStatus", () => {
  it("puts every status in the result, even an empty one, keeping the order", () => {
    const tasks = [makeTask("a", "done"), makeTask("b", "new"), makeTask("c", "done")];

    const groups = groupTasksByStatus(tasks);

    expect(groups.new.map((task) => task.id)).toEqual(["b"]);
    expect(groups.in_progress).toEqual([]);
    expect(groups.done.map((task) => task.id)).toEqual(["a", "c"]);
  });
});

describe("applyStatusChange", () => {
  it("returns a new list with the task moved to the new status", () => {
    const tasks = [makeTask("a", "new"), makeTask("b", "new")];

    const next = applyStatusChange(tasks, { id: "b", status: "done" });

    expect(next.map((task) => task.status)).toEqual(["new", "done"]);
    expect(tasks[1]?.status).toBe("new");
    expect(next[0]).toBe(tasks[0]);
  });

  it("leaves the list as is for an unknown task or the same status", () => {
    const tasks = [makeTask("a", "new")];

    expect(applyStatusChange(tasks, { id: "x", status: "done" })[0]).toBe(tasks[0]);
    expect(applyStatusChange(tasks, { id: "a", status: "new" })[0]).toBe(tasks[0]);
  });
});
