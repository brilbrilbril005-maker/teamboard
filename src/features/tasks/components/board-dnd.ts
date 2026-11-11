import type {
  Active,
  Announcements,
  ClientRect,
  KeyboardCoordinateGetter,
  Over,
  ScreenReaderInstructions,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from "../model";

/**
 * Перетаскивание карточек между колонками доски: данные карточки, объявления для
 * экранного диктора на русском и управление с клавиатуры (стрелки — соседняя колонка).
 * Без React: проверяется обычными тестами.
 */

/** Что карточка сообщает о себе при перетаскивании. */
export type DragTaskData = { readonly title: string; readonly status: TaskStatus };

export function isTaskStatus(value: UniqueIdentifier | undefined): value is TaskStatus {
  return TASK_STATUSES.some((status) => status === value);
}

export function dragTaskData(item: Pick<Active, "data"> | null): DragTaskData | null {
  const data: unknown = item?.data.current;
  if (typeof data !== "object" || data === null || !("title" in data) || !("status" in data)) {
    return null;
  }
  const { title, status } = data;
  return typeof title === "string" && typeof status === "string" && isTaskStatus(status)
    ? { title, status }
    : null;
}

function describeTask(active: Pick<Active, "data">): string {
  const data = dragTaskData(active);
  return data ? `Задача «${data.title}»` : "Задача";
}

function columnName(over: Pick<Over, "id"> | null): string | null {
  return over && isTaskStatus(over.id) ? `«${TASK_STATUS_LABELS[over.id]}»` : null;
}

export const BOARD_SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "Чтобы переместить задачу в другую колонку, нажмите пробел. " +
    "Стрелками влево и вправо выберите колонку, пробелом или Enter опустите задачу. " +
    "Escape — отменить перемещение.",
};

export const BOARD_ANNOUNCEMENTS: Announcements = {
  onDragStart({ active }) {
    const data = dragTaskData(active);
    const from = data ? ` Сейчас в колонке «${TASK_STATUS_LABELS[data.status]}».` : "";
    return `${describeTask(active)} поднята.${from}`;
  },
  onDragOver({ active, over }) {
    const column = columnName(over);
    return column
      ? `${describeTask(active)} над колонкой ${column}.`
      : `${describeTask(active)} вне колонок.`;
  },
  onDragEnd({ active, over }) {
    const column = columnName(over);
    if (!column) {
      return `${describeTask(active)} опущена вне колонок. Статус не изменился.`;
    }
    return dragTaskData(active)?.status === over?.id
      ? `${describeTask(active)} осталась в колонке ${column}.`
      : `${describeTask(active)} перемещена в колонку ${column}.`;
  },
  onDragCancel({ active }) {
    return `Перемещение отменено. ${describeTask(active)} осталась на месте.`;
  },
};

type ColumnRect = { readonly status: TaskStatus; readonly rect: ClientRect };

function columnRects(rects: ReadonlyMap<UniqueIdentifier, ClientRect>): readonly ColumnRect[] {
  return TASK_STATUSES.flatMap((status) => {
    const rect = rects.get(status);
    return rect ? [{ status, rect }] : [];
  }).toSorted((a, b) => a.rect.left - b.rect.left);
}

function currentColumnIndex(
  columns: readonly ColumnRect[],
  over: Pick<Over, "id"> | null,
  dragged: ClientRect,
): number {
  const byOver = columns.findIndex((column) => column.status === over?.id);
  if (byOver !== -1) {
    return byOver;
  }
  const centerX = dragged.left + dragged.width / 2;
  return columns.findIndex(
    (column) => centerX >= column.rect.left && centerX <= column.rect.left + column.rect.width,
  );
}

const HORIZONTAL_STEP: Readonly<Record<string, -1 | 1>> = { ArrowLeft: -1, ArrowRight: 1 };
const ARROW_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

/**
 * Клавиатура: стрелка влево/вправо переносит карточку сразу в соседнюю колонку
 * (по высоте карточка остаётся где была, но не выходит за пределы колонки).
 * Вверх/вниз ничего не делают: порядок внутри колонки задаёт сервер.
 */
export const columnKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { currentCoordinates, context },
) => {
  if (!ARROW_KEYS.includes(event.code)) {
    return undefined;
  }
  event.preventDefault();
  const step = HORIZONTAL_STEP[event.code];
  const dragged = context.collisionRect;
  if (!step || !dragged) {
    return undefined;
  }
  const columns = columnRects(context.droppableRects);
  const target = columns[currentColumnIndex(columns, context.over, dragged) + step];
  if (!target) {
    return undefined;
  }
  const { rect } = target;
  const maxY = Math.max(rect.top, rect.top + rect.height - dragged.height);
  return {
    x: rect.left + (rect.width - dragged.width) / 2,
    y: Math.min(Math.max(currentCoordinates.y, rect.top), maxY),
  };
};
