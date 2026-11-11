"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Ellipsis, GripVertical } from "lucide-react";
import { useId, useLayoutEffect, useState } from "react";
import { cn } from "@/components/ui/cn";
import type { IsoDate } from "@/lib/dates";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task, type TaskStatus } from "../model";
import { StatusIcon, taskStatusBackground } from "./badges";
import {
  BOARD_ANNOUNCEMENTS,
  BOARD_SCREEN_READER_INSTRUCTIONS,
  columnKeyboardCoordinates,
  dragTaskData,
  isTaskStatus,
  type DragTaskData,
} from "./board-dnd";
import { TASK_CARD_CLASS_NAME, TaskCardBody } from "./task-card";
import { TaskCardMenu } from "./task-card-menu";
import { useTaskDialogs } from "./task-dialogs";
import { groupTasksByStatus } from "./task-grouping";
import { useTaskWorkspace } from "./task-workspace-context";

// Мышь: перетаскивание начинается после небольшого сдвига, чтобы обычный щелчок открывал задачу.
const MOUSE_DRAG_DISTANCE_PX = 6;
// Палец: нужно задержать касание, иначе нельзя было бы прокручивать страницу.
const TOUCH_DRAG_DELAY_MS = 250;
const TOUCH_DRAG_TOLERANCE_PX = 8;
const FALLBACK_CARD_HEIGHT_PX = 140;

/**
 * Обработчики датчиков dnd-kit раздаём по разным элементам: мышь и палец — вся карточка,
 * клавиатура — кнопка-ручка (иначе внутри карточки-кнопки оказались бы другие кнопки).
 */
function pickListener<E>(
  listeners: ReturnType<typeof useDraggable>["listeners"],
  name: "onMouseDown" | "onTouchStart" | "onKeyDown",
): ((event: E) => void) | undefined {
  const listener = listeners?.[name];
  return listener ? (event: E) => listener(event) : undefined;
}

/** Под указателем — его колонка; с клавиатуры (указателя нет) — пересечение прямоугольников. */
const detectColumn: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

/**
 * Доска: три колонки по статусам. Карточку можно перетащить в другую колонку мышью,
 * пальцем (после короткого удержания) или с клавиатуры: кнопка-ручка на карточке,
 * пробел — взять, стрелки — колонка, пробел — опустить. Диктор озвучивает каждый шаг.
 */
export function TaskBoard() {
  const { tasks, today, changeStatus, filters } = useTaskWorkspace();
  const [activeId, setActiveId] = useState<string | null>(null);
  const dndId = useId();
  const groups = groupTasksByStatus(tasks);
  const activeTask = tasks.find((task) => task.id === activeId) ?? null;

  // Страница скрыта (<Activity>) посреди перетаскивания — не оставляем «висящую» карточку.
  useLayoutEffect(() => () => setActiveId(null), []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: MOUSE_DRAG_DISTANCE_PX } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: TOUCH_DRAG_DELAY_MS, tolerance: TOUCH_DRAG_TOLERANCE_PX },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: columnKeyboardCoordinates }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const task = tasks.find((candidate) => candidate.id === active.id);
    if (task && over && isTaskStatus(over.id) && over.id !== task.status) {
      changeStatus(task, over.id);
    }
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={detectColumn}
      accessibility={{
        announcements: BOARD_ANNOUNCEMENTS,
        screenReaderInstructions: BOARD_SCREEN_READER_INSTRUCTIONS,
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-3 gap-4 xl:gap-5">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={groups[status]}
            today={today}
            query={filters.search}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className={cn(TASK_CARD_CLASS_NAME, "shadow-drag rotate-2 cursor-grabbing")}>
            <TaskCardBody
              task={activeTask}
              today={today}
              menu={<Ellipsis aria-hidden="true" className="text-muted m-2 size-4" />}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumn({
  status,
  tasks,
  today,
  query,
}: {
  readonly status: TaskStatus;
  readonly tasks: readonly Task[];
  readonly today: IsoDate;
  readonly query: string | undefined;
}) {
  const headingId = useId();
  const { setNodeRef, isOver, active } = useDroppable({ id: status });
  const dragged: DragTaskData | null = dragTaskData(active);
  const showDropZone = isOver && dragged !== null && dragged.status !== status;
  const dropZoneHeight = active?.rect.current.initial?.height ?? FALLBACK_CARD_HEIGHT_PX;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        "rounded-card bg-surface-muted/60 dark:bg-surface/40 flex min-h-[calc(100dvh-17rem)] min-w-0 flex-col transition-colors",
        showDropZone && "bg-primary-soft/40",
      )}
    >
      <header
        className={cn(
          "rounded-t-card flex items-center gap-2.5 px-4 py-3.5",
          taskStatusBackground(status),
        )}
      >
        <StatusIcon status={status} className="size-6" />
        <h2 id={headingId} className="text-lg font-semibold">
          {TASK_STATUS_LABELS[status]}
        </h2>
        <span className="text-muted text-lg">
          ({tasks.length})<span className="sr-only"> задач</span>
        </span>
      </header>
      <ul className="flex flex-1 flex-col gap-3 p-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <DraggableTaskCard task={task} today={today} query={query} />
          </li>
        ))}
        {showDropZone ? (
          <li
            aria-hidden="true"
            style={{ height: dropZoneHeight }}
            className="rounded-card border-primary bg-primary-soft/50 border-2 border-dashed"
          />
        ) : null}
        {tasks.length === 0 && !showDropZone ? (
          <li className="text-muted rounded-card border-border flex min-h-24 items-center justify-center border border-dashed text-sm">
            Нет задач
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function DraggableTaskCard({
  task,
  today,
  query,
}: {
  readonly task: Task;
  readonly today: IsoDate;
  readonly query: string | undefined;
}) {
  const { openEdit } = useTaskDialogs();
  const data: DragTaskData = { title: task.title, status: task.status };
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: task.id,
    data,
    attributes: { roleDescription: "перетаскиваемая задача" },
  });

  return (
    <article
      ref={setNodeRef}
      onMouseDown={pickListener(listeners, "onMouseDown")}
      onTouchStart={pickListener(listeners, "onTouchStart")}
      className={cn(
        TASK_CARD_CLASS_NAME,
        "cursor-grab touch-manipulation",
        isDragging && "opacity-40",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        onKeyDown={pickListener(listeners, "onKeyDown")}
        aria-label={`Переместить задачу «${task.title}» в другую колонку`}
        className="text-muted hover:text-foreground focus-visible:bg-surface absolute top-4 left-0.5 z-10 flex h-6 w-4 cursor-grab items-center justify-center rounded opacity-0 transition-opacity group-hover/card:opacity-100 focus:opacity-100 pointer-coarse:hidden"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      <TaskCardBody
        task={task}
        today={today}
        query={query}
        onOpen={() => openEdit(task)}
        menu={<TaskCardMenu task={task} />}
      />
    </article>
  );
}
