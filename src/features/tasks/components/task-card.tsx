"use client";

import { CircleCheck } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import { MemberAvatar } from "@/features/users/components/member-avatar";
import type { IsoDate } from "@/lib/dates";
import type { Task } from "../model";
import { DueDateBadge, PriorityBadge, StatusBadge } from "./badges";
import { HighlightedText } from "./highlighted-text";

export type TaskCardOptions = {
  /** Поисковый запрос — совпадения подсвечиваются. */
  readonly query?: string;
  /** Показать плашку статуса (результаты поиска на телефоне, где колонок нет). */
  readonly showStatus?: boolean;
  /** Завершённую задачу отметить галочкой и зачеркнуть (мобильная вкладка «Завершена»). */
  readonly markDone?: boolean;
};

type TaskCardBodyProps = TaskCardOptions & {
  readonly task: Task;
  readonly today: IsoDate;
  /** Открыть задачу (окно редактирования). Без него заголовок — просто текст (тень при перетаскивании). */
  readonly onOpen?: () => void;
  /** Кнопка «⋯» или её неактивная копия. */
  readonly menu: ReactNode;
};

export const TASK_CARD_CLASS_NAME =
  "group/card rounded-card border-border bg-surface shadow-card relative border p-4 transition-colors hover:border-border-strong";

/**
 * Содержимое карточки по макету: заголовок и «⋯», описание в одну строку,
 * приоритет и дедлайн, ответственный. Весь прямоугольник карточки открывает задачу:
 * заголовок-кнопка растянута на карточку псевдоэлементом, а меню лежит поверх.
 */
export function TaskCardBody({
  task,
  today,
  onOpen,
  menu,
  query,
  showStatus = false,
  markDone = false,
}: TaskCardBodyProps) {
  const isDone = markDone && task.status === "done";
  const title = <HighlightedText text={task.title} query={query} />;

  return (
    <>
      <div className="flex items-start gap-2">
        {isDone ? (
          <CircleCheck
            aria-hidden="true"
            className="text-status-done-icon mt-0.5 size-5 shrink-0"
          />
        ) : null}
        <h3
          className={cn(
            "text-body min-w-0 flex-1 font-semibold wrap-anywhere",
            isDone && "text-muted line-through",
          )}
        >
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              aria-haspopup="dialog"
              className="after:rounded-card cursor-pointer text-left after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--color-primary)]"
            >
              {title}
            </button>
          ) : (
            title
          )}
        </h3>
        <div className="relative z-10 -mt-1 -mr-2 shrink-0">{menu}</div>
      </div>
      {task.description ? (
        <p className="text-muted mt-1 truncate text-sm">
          <HighlightedText text={task.description} query={query} />
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {showStatus ? <StatusBadge status={task.status} /> : null}
        <PriorityBadge priority={task.priority} />
        <DueDateBadge task={task} today={today} />
      </div>
      <MemberAvatar member={task.assignee} size="sm" className="text-body mt-3 max-w-full" />
    </>
  );
}

/** Карточка без перетаскивания — для мобильной версии. */
export function TaskCard({
  className,
  ...props
}: TaskCardBodyProps & Pick<ComponentProps<"article">, "className">) {
  return (
    <article className={cn(TASK_CARD_CLASS_NAME, className)}>
      <TaskCardBody {...props} />
    </article>
  );
}
