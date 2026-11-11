import {
  CalendarDays,
  CircleCheck,
  File as FileIcon,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Badge, Dot, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";
import type { IsoDate } from "@/lib/dates";
import { describeDueDate, type DueDateTone } from "../due-date";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../model";

/**
 * Плашки задачи по макету: статус (иконка + текст), приоритет (точка + текст), дедлайн.
 * Тексты берутся из model.ts — нигде не дублируются.
 */

export const TASK_STATUS_ICONS: Readonly<Record<TaskStatus, LucideIcon>> = {
  new: FileIcon,
  in_progress: RefreshCw,
  done: CircleCheck,
};

const STATUS_ICON_COLORS: Readonly<Record<TaskStatus, string>> = {
  new: "text-status-new-icon",
  in_progress: "text-status-in-progress-icon",
  done: "text-status-done-icon",
};

const STATUS_BACKGROUNDS: Readonly<Record<TaskStatus, string>> = {
  new: "bg-status-new",
  in_progress: "bg-status-in-progress",
  done: "bg-status-done",
};

/** Фон заголовка колонки или вкладки статуса (серая / голубая / мятная). */
export function taskStatusBackground(status: TaskStatus): string {
  return STATUS_BACKGROUNDS[status];
}

/** Иконка статуса в его цвете: в заголовках колонок, вкладках, пунктах выбора. */
export function StatusIcon({
  status,
  className,
}: {
  readonly status: TaskStatus;
  readonly className?: string;
}) {
  const Icon = TASK_STATUS_ICONS[status];
  return (
    <Icon
      aria-hidden="true"
      className={cn("size-5 shrink-0", STATUS_ICON_COLORS[status], className)}
    />
  );
}

export function StatusBadge({
  status,
  size = "sm",
  className,
}: {
  readonly status: TaskStatus;
  readonly size?: "sm" | "md";
  readonly className?: string;
}) {
  return (
    <Badge
      size={size}
      icon={<StatusIcon status={status} />}
      className={cn(STATUS_BACKGROUNDS[status], "text-foreground", className)}
    >
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}

const PRIORITY_TONES: Readonly<Record<TaskPriority, BadgeTone>> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

const PRIORITY_DOTS: Readonly<Record<TaskPriority, string>> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

/** Точка приоритета — для пунктов выбора и фильтров. */
export function PriorityDot({ priority }: { readonly priority: TaskPriority }) {
  return <Dot className={PRIORITY_DOTS[priority]} />;
}

export function PriorityBadge({
  priority,
  className,
}: {
  readonly priority: TaskPriority;
  readonly className?: string;
}) {
  return (
    <Badge
      tone={PRIORITY_TONES[priority]}
      icon={<PriorityDot priority={priority} />}
      className={className}
    >
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

const DUE_DATE_TONES: Readonly<Record<DueDateTone, BadgeTone>> = {
  default: "neutral",
  soon: "warning",
  overdue: "danger",
};

/**
 * Дедлайн: «15 нояб.», «Завтра» (янтарная), «Просрочено · 8 нояб.» (красная).
 * Без дедлайна ничего не показывает. Завершённая задача не бывает просроченной.
 */
export function DueDateBadge({
  task,
  today,
  className,
}: {
  readonly task: Pick<Task, "status" | "dueDate">;
  /**
   * «Сегодня» по часовому поясу команды. Вычисляйте один раз на странице (todayIso() на
   * сервере, внутри <Suspense>) и передавайте вниз: так сервер и браузер покажут одно и то же,
   * а Cache Components не ругается на new Date() при отрисовке.
   */
  readonly today: IsoDate;
  readonly className?: string;
}) {
  const view = describeDueDate(task, today);
  if (!view) {
    return null;
  }
  return (
    <Badge
      tone={DUE_DATE_TONES[view.tone]}
      icon={<CalendarDays aria-hidden="true" />}
      className={cn(view.tone === "default" && "bg-transparent px-0", className)}
    >
      <span className="sr-only">Дедлайн: </span>
      {view.label}
    </Badge>
  );
}
