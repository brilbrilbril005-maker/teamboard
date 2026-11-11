import { describe, expect, it } from "vitest";
import { splitByQuery } from "./highlight";

describe("splitByQuery", () => {
  it("returns the whole text when there is no query", () => {
    expect(splitByQuery("Исправить баг", undefined)).toEqual([
      { text: "Исправить баг", match: false },
    ]);
    expect(splitByQuery("Исправить баг", "   ")).toEqual([{ text: "Исправить баг", match: false }]);
  });

  it("marks matches ignoring the letter case, keeping the original spelling", () => {
    expect(splitByQuery("Баг в фильтрах и ещё один баг", "БАГ")).toEqual([
      { text: "Баг", match: true },
      { text: " в фильтрах и ещё один ", match: false },
      { text: "баг", match: true },
    ]);
  });

  it("treats special characters in the query literally", () => {
    expect(splitByQuery("Цена (1+1)?", "(1+1)?")).toEqual([
      { text: "Цена ", match: false },
      { text: "(1+1)?", match: true },
    ]);
  });

  it("returns the text unchanged when nothing matches", () => {
    expect(splitByQuery("Отчёт", "оплата")).toEqual([{ text: "Отчёт", match: false }]);
  });

  it("handles an empty text", () => {
    expect(splitByQuery("", "баг")).toEqual([{ text: "", match: false }]);
  });
});
