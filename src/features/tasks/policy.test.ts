import { describe, expect, it } from "vitest";
import { canDeleteTask, canEditTask } from "./policy";

const author = { id: "user-author" };
const teammate = { id: "user-teammate" };
const task = { creator: { id: author.id } };

describe("task policy", () => {
  it("lets any signed-in team member edit a task", () => {
    expect(canEditTask(author)).toBe(true);
    expect(canEditTask(teammate)).toBe(true);
  });

  it("does not let a guest edit a task", () => {
    expect(canEditTask(null)).toBe(false);
  });

  it("lets the author delete their task", () => {
    expect(canDeleteTask(author, task)).toBe(true);
  });

  it("does not let another team member delete the task", () => {
    expect(canDeleteTask(teammate, task)).toBe(false);
  });

  it("does not let a guest delete the task", () => {
    expect(canDeleteTask(null, task)).toBe(false);
  });
});
