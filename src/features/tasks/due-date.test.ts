import { describe, expect, it } from "vitest";
import { describeDueDate } from "./due-date";

const TODAY = "2026-11-11";

describe("describeDueDate", () => {
  it("returns null when the task has no deadline", () => {
    expect(describeDueDate({ status: "new", dueDate: null }, TODAY)).toBeNull();
  });

  it("marks a past deadline of an open task as overdue with the date", () => {
    expect(describeDueDate({ status: "in_progress", dueDate: "2026-11-08" }, TODAY)).toEqual({
      tone: "overdue",
      label: "Просрочено · 8 нояб.",
    });
  });

  it("highlights today and tomorrow", () => {
    expect(describeDueDate({ status: "new", dueDate: TODAY }, TODAY)).toEqual({
      tone: "soon",
      label: "Сегодня",
    });
    expect(describeDueDate({ status: "new", dueDate: "2026-11-12" }, TODAY)).toEqual({
      tone: "soon",
      label: "Завтра",
    });
  });

  it("shows later deadlines as a plain short date", () => {
    expect(describeDueDate({ status: "new", dueDate: "2026-11-15" }, TODAY)).toEqual({
      tone: "default",
      label: "15 нояб.",
    });
  });

  it("never marks a completed task as overdue or urgent", () => {
    expect(describeDueDate({ status: "done", dueDate: "2026-11-08" }, TODAY)).toEqual({
      tone: "default",
      label: "8 нояб.",
    });
    expect(describeDueDate({ status: "done", dueDate: TODAY }, TODAY)).toEqual({
      tone: "default",
      label: "11 нояб.",
    });
  });
});
