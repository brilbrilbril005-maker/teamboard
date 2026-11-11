import { describe, expect, it } from "vitest";
import { nameInitial, shortName } from "./names";

describe("shortName", () => {
  it("shortens «Имя Фамилия» to «Имя Ф.»", () => {
    expect(shortName("Анна Смирнова")).toBe("Анна С.");
  });

  it("uses only the first two words and ignores extra spaces", () => {
    expect(shortName("  Максим   Петров  Иванович ")).toBe("Максим П.");
  });

  it("keeps a single-word name as is", () => {
    expect(shortName("Дмитрий")).toBe("Дмитрий");
  });

  it("upper-cases the surname initial", () => {
    expect(shortName("ольга климова")).toBe("ольга К.");
  });

  it("returns an empty string for a blank name", () => {
    expect(shortName("   ")).toBe("");
  });
});

describe("nameInitial", () => {
  it("returns the first letter in upper case", () => {
    expect(nameInitial("анна")).toBe("А");
    expect(nameInitial("  Олег")).toBe("О");
  });

  it("falls back to a question mark for a blank name", () => {
    expect(nameInitial(" ")).toBe("?");
  });
});
