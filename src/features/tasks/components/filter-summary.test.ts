import { describe, expect, it } from "vitest";
import { TASK_STATUSES } from "../model";
import {
  assigneeFilterLabel,
  countActiveFilterGroups,
  describeFilterChips,
  hasActiveFilters,
  normalizeFilters,
  toggleAssignee,
  toggleInList,
  withoutFilter,
} from "./filter-summary";

const ANNA = { id: "a1", name: "Анна Смирнова" };
const OLGA = { id: "o1", name: "Ольга Климова" };
const members = [ANNA, OLGA];

describe("normalizeFilters", () => {
  it("drops empty values", () => {
    expect(
      normalizeFilters({ search: "  ", statuses: [], priorities: [], overdueOnly: false }),
    ).toEqual({});
  });

  it("keeps meaningful values and trims the search", () => {
    expect(normalizeFilters({ search: " баг ", statuses: ["new"], overdueOnly: true })).toEqual({
      search: "баг",
      statuses: ["new"],
      overdueOnly: true,
    });
  });
});

describe("hasActiveFilters and countActiveFilterGroups", () => {
  it("sees no filters in an empty object", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(countActiveFilterGroups({})).toBe(0);
  });

  it("counts filter groups but not the search", () => {
    const filters = { search: "баг", statuses: ["new", "done"] as const, overdueOnly: true };

    expect(hasActiveFilters(filters)).toBe(true);
    expect(countActiveFilterGroups(filters)).toBe(2);
    expect(hasActiveFilters({ search: "баг" })).toBe(true);
  });
});

describe("withoutFilter", () => {
  it("removes one filter and keeps the rest", () => {
    const filters = { statuses: ["new"] as const, assignee: { kind: "unassigned" as const } };

    expect(withoutFilter(filters, "assignee")).toEqual({ statuses: ["new"] });
  });
});

describe("toggleInList", () => {
  it("adds a value keeping the canonical order", () => {
    expect(toggleInList(["done"], "new", TASK_STATUSES)).toEqual(["new", "done"]);
    expect(toggleInList(undefined, "in_progress", TASK_STATUSES)).toEqual(["in_progress"]);
  });

  it("removes a value that is already selected", () => {
    const list = ["new", "done"] as const;

    expect(toggleInList(list, "new", TASK_STATUSES)).toEqual(["done"]);
    expect(list).toEqual(["new", "done"]);
  });
});

describe("toggleAssignee", () => {
  it("selects an assignee and clears it on the second click", () => {
    const selected = toggleAssignee({}, { kind: "member", id: "a1" });

    expect(selected).toEqual({ assignee: { kind: "member", id: "a1" } });
    expect(toggleAssignee(selected, { kind: "member", id: "a1" })).toEqual({});
  });

  it("switches between a member and «без ответственного»", () => {
    const selected = toggleAssignee(
      { assignee: { kind: "member", id: "a1" } },
      { kind: "unassigned" },
    );

    expect(selected).toEqual({ assignee: { kind: "unassigned" } });
    expect(toggleAssignee(selected, { kind: "member", id: "o1" })).toEqual({
      assignee: { kind: "member", id: "o1" },
    });
  });
});

describe("assigneeFilterLabel", () => {
  it("names a member shortly and handles the other cases", () => {
    expect(assigneeFilterLabel({ kind: "member", id: "a1" }, members)).toBe("Анна С.");
    expect(assigneeFilterLabel({ kind: "unassigned" }, members)).toBe("Без ответственного");
    expect(assigneeFilterLabel({ kind: "member", id: "gone" }, members)).toBe("Участник не найден");
  });
});

describe("describeFilterChips", () => {
  it("has no chips without filters", () => {
    expect(describeFilterChips({ search: "баг", overdueOnly: true }, members)).toEqual([]);
  });

  it("describes the assignee, statuses and priorities in a stable order", () => {
    const chips = describeFilterChips(
      {
        assignee: { kind: "member", id: "a1" },
        statuses: ["done", "new"],
        priorities: ["low", "high"],
      },
      members,
    );

    expect(chips).toEqual([
      { key: "assignee", label: "Ответственный: Анна С." },
      { key: "statuses", label: "Статус: Новая, Завершена" },
      { key: "priorities", label: "Приоритет: Высокий, Низкий" },
    ]);
  });
});
