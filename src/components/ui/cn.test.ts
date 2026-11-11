import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins classes and skips falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("lets a later Tailwind class override a conflicting earlier one", () => {
    expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4");
  });

  it("understands project colour tokens as colours", () => {
    expect(cn("bg-surface", "bg-primary")).toBe("bg-primary");
  });
});

describe("cn with design tokens", () => {
  it("treats typography tokens as font sizes, not colours", () => {
    expect(cn("text-caption text-muted")).toBe("text-caption text-muted");
    expect(cn("text-body", "text-h2")).toBe("text-h2");
  });

  it("knows radius and shadow tokens", () => {
    expect(cn("rounded-control", "rounded-card")).toBe("rounded-card");
    expect(cn("shadow-card", "shadow-popover")).toBe("shadow-popover");
  });
});
