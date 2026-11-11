import { describe, expect, it } from "vitest";
import {
  foundTasksLabel,
  pluralRu,
  showTasksLabel,
  shownOfTotalLabel,
  tasksCountLabel,
} from "./count-labels";

describe("pluralRu", () => {
  it.each([
    [1, "задача"],
    [2, "задачи"],
    [4, "задачи"],
    [5, "задач"],
    [11, "задач"],
    [12, "задач"],
    [14, "задач"],
    [21, "задача"],
    [22, "задачи"],
    [25, "задач"],
    [101, "задача"],
    [111, "задач"],
    [0, "задач"],
  ])("chooses the right form for %i", (count, expected) => {
    expect(pluralRu(count, ["задача", "задачи", "задач"])).toBe(expected);
  });
});

describe("task count labels", () => {
  it("counts tasks", () => {
    expect(tasksCountLabel(3)).toBe("3 задачи");
  });

  it.each([
    [0, "Ничего не найдено"],
    [1, "Найдена 1 задача"],
    [3, "Найдено 3 задачи"],
    [11, "Найдено 11 задач"],
    [21, "Найдена 21 задача"],
  ])("reports %i found tasks", (count, expected) => {
    expect(foundTasksLabel(count)).toBe(expected);
  });

  it.each([
    [0, "Нет подходящих задач"],
    [1, "Показать 1 задачу"],
    [3, "Показать 3 задачи"],
    [7, "Показать 7 задач"],
  ])("labels the filter button for %i tasks", (count, expected) => {
    expect(showTasksLabel(count)).toBe(expected);
  });

  it.each([
    [3, 9, "Показано 3 из 9 задач"],
    [1, 21, "Показана 1 из 21 задачи"],
    [2, 3, "Показано 2 из 3 задач"],
    [12, 12, "Показано 12 из 12 задач"],
  ])("shows %i of %i", (shown, total, expected) => {
    expect(shownOfTotalLabel(shown, total)).toBe(expected);
  });
});
