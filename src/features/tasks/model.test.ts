import { describe, expect, it } from "vitest";
import { isTaskOverdue, toIsoDate } from "./model";

const TODAY = "2026-11-11";

describe("isTaskOverdue", () => {
  it("is true when the due date has passed and the task is not done", () => {
    expect(isTaskOverdue({ status: "in_progress", dueDate: "2026-11-08" }, TODAY)).toBe(true);
  });

  it("is false when the task is due today", () => {
    expect(isTaskOverdue({ status: "new", dueDate: TODAY }, TODAY)).toBe(false);
  });

  it("is false for a finished task even if the due date has passed", () => {
    expect(isTaskOverdue({ status: "done", dueDate: "2026-11-01" }, TODAY)).toBe(false);
  });

  it("is false for a task without a due date", () => {
    expect(isTaskOverdue({ status: "new", dueDate: null }, TODAY)).toBe(false);
  });
});

describe("toIsoDate", () => {
  it("formats a date as YYYY-MM-DD in the given time zone", () => {
    const lateEveningUtc = new Date("2026-11-11T22:30:00.000Z");

    expect(toIsoDate(lateEveningUtc, "UTC")).toBe("2026-11-11");
    expect(toIsoDate(lateEveningUtc, "Europe/Moscow")).toBe("2026-11-12");
  });
});
