import type { Active, ClientRect, Over, SensorContext } from "@dnd-kit/core";
import { describe, expect, it, vi } from "vitest";
import {
  BOARD_ANNOUNCEMENTS,
  columnKeyboardCoordinates,
  dragTaskData,
  isTaskStatus,
} from "./board-dnd";

function rect(left: number, top: number, width: number, height: number): ClientRect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

const active = {
  id: "task-1",
  data: { current: { title: "Исправить баг", status: "new" } },
} as unknown as Active;

function over(id: string): Over {
  return { id } as unknown as Over;
}

describe("dragTaskData", () => {
  it("reads the task title and status", () => {
    expect(dragTaskData(active)).toEqual({ title: "Исправить баг", status: "new" });
  });

  it("returns null for foreign or broken data", () => {
    expect(dragTaskData(null)).toBeNull();
    expect(dragTaskData({ data: { current: { title: 1, status: "new" } } } as never)).toBeNull();
    expect(dragTaskData({ data: { current: { title: "a", status: "x" } } } as never)).toBeNull();
    expect(dragTaskData({ data: { current: undefined } } as never)).toBeNull();
  });
});

describe("isTaskStatus", () => {
  it("accepts only known statuses", () => {
    expect(isTaskStatus("done")).toBe(true);
    expect(isTaskStatus("task-1")).toBe(false);
    expect(isTaskStatus(undefined)).toBe(false);
  });
});

describe("BOARD_ANNOUNCEMENTS", () => {
  it("speaks Russian at every step", () => {
    expect(BOARD_ANNOUNCEMENTS.onDragStart({ active })).toBe(
      "Задача «Исправить баг» поднята. Сейчас в колонке «Новая».",
    );
    expect(BOARD_ANNOUNCEMENTS.onDragOver({ active, over: over("in_progress") })).toBe(
      "Задача «Исправить баг» над колонкой «В работе».",
    );
    expect(BOARD_ANNOUNCEMENTS.onDragOver({ active, over: null })).toBe(
      "Задача «Исправить баг» вне колонок.",
    );
    expect(BOARD_ANNOUNCEMENTS.onDragEnd({ active, over: over("done") })).toBe(
      "Задача «Исправить баг» перемещена в колонку «Завершена».",
    );
    expect(BOARD_ANNOUNCEMENTS.onDragEnd({ active, over: over("new") })).toBe(
      "Задача «Исправить баг» осталась в колонке «Новая».",
    );
    expect(BOARD_ANNOUNCEMENTS.onDragEnd({ active, over: null })).toBe(
      "Задача «Исправить баг» опущена вне колонок. Статус не изменился.",
    );
    expect(BOARD_ANNOUNCEMENTS.onDragCancel({ active, over: null })).toBe(
      "Перемещение отменено. Задача «Исправить баг» осталась на месте.",
    );
  });

  it("still speaks when the card data is missing", () => {
    const unknown = { id: "x", data: { current: undefined } } as unknown as Active;

    expect(BOARD_ANNOUNCEMENTS.onDragStart({ active: unknown })).toBe("Задача поднята.");
  });
});

describe("columnKeyboardCoordinates", () => {
  const droppableRects = new Map([
    ["done", rect(800, 100, 300, 600)],
    ["new", rect(0, 100, 300, 600)],
    ["in_progress", rect(400, 100, 300, 600)],
  ]);
  const dragged = rect(20, 150, 260, 120);

  function press(code: string, overId: string | null, currentY = 150) {
    const event = { code, preventDefault: vi.fn() } as unknown as KeyboardEvent;
    const context = {
      collisionRect: dragged,
      droppableRects,
      over: overId ? over(overId) : null,
    } as unknown as SensorContext;
    const result = columnKeyboardCoordinates(event, {
      active: "task-1",
      currentCoordinates: { x: dragged.left, y: currentY },
      context,
    });
    return { result, event };
  }

  it("moves to the centre of the next column on ArrowRight", () => {
    const { result, event } = press("ArrowRight", "new");

    expect(result).toEqual({ x: 420, y: 150 });
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("moves back on ArrowLeft and stays put at the edge", () => {
    expect(press("ArrowLeft", "in_progress").result).toEqual({ x: 20, y: 150 });
    expect(press("ArrowLeft", "new").result).toBeUndefined();
    expect(press("ArrowRight", "done").result).toBeUndefined();
  });

  it("finds the current column by position when nothing is under the card", () => {
    expect(press("ArrowRight", null).result).toEqual({ x: 420, y: 150 });
  });

  it("keeps the card inside the target column vertically", () => {
    expect(press("ArrowRight", "new", 20).result).toEqual({ x: 420, y: 100 });
    expect(press("ArrowRight", "new", 900).result).toEqual({ x: 420, y: 580 });
  });

  it("swallows vertical arrows and ignores other keys", () => {
    const vertical = press("ArrowDown", "new");

    expect(vertical.result).toBeUndefined();
    expect(vertical.event.preventDefault).toHaveBeenCalled();
    const other = press("KeyA", "new");
    expect(other.result).toBeUndefined();
    expect(other.event.preventDefault).not.toHaveBeenCalled();
  });
});
