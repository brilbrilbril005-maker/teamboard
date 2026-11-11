import { describe, expect, it } from "vitest";
import { parseTaskFilters } from "../schemas";
import { parseTaskView, workspaceHref } from "./workspace-url";

const MEMBER_ID = "0a9d9d6e-1f0b-4f6e-8d57-2c1c4f7b9e22";

describe("parseTaskView", () => {
  it("reads the list view from the address", () => {
    expect(parseTaskView({ view: "list" })).toBe("list");
  });

  it.each([undefined, "table", ""])("falls back to the board for %s", (view) => {
    expect(parseTaskView({ view })).toBe("board");
  });

  it("uses the first value when the parameter is repeated", () => {
    expect(parseTaskView({ view: ["list", "board"] })).toBe("list");
  });
});

describe("workspaceHref", () => {
  it("returns the bare path when nothing is selected", () => {
    expect(workspaceHref("/", { filters: {}, view: "board" })).toBe("/");
  });

  it("writes filters and a non-default view with readable commas", () => {
    const href = workspaceHref("/", {
      filters: { statuses: ["new", "done"], assignee: { kind: "member", id: MEMBER_ID } },
      view: "list",
    });

    expect(href).toBe(`/?status=new,done&assignee=${MEMBER_ID}&view=list`);
  });

  it("round-trips through the address parser", () => {
    const filters = parseTaskFilters({
      q: "отчёт, срочно",
      priority: "high,low",
      assignee: "none",
      overdue: "1",
    });
    const href = workspaceHref("/", { filters, view: "list" });
    const params = Object.fromEntries(new URL(href, "http://localhost").searchParams);

    expect(parseTaskFilters(params)).toEqual(filters);
    expect(parseTaskView(params)).toBe("list");
  });
});
