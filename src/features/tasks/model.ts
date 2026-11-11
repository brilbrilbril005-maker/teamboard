import type { TeamMember } from "@/features/users/model";
import type { IsoDate } from "@/lib/dates";

/**
 * Предметная модель задач. Файл чистый: без базы, без Next.js.
 * Его используют и схема базы, и проверки ввода, и интерфейс —
 * поэтому список статусов и приоритетов задан ровно в одном месте.
 */

export const TASK_STATUSES = ["new", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Readonly<Record<TaskStatus, string>> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Завершена",
};

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Readonly<Record<TaskPriority, string>> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export const DEFAULT_TASK_STATUS: TaskStatus = "new";
export const DEFAULT_TASK_PRIORITY: TaskPriority = "medium";

export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_DESCRIPTION_MAX_LENGTH = 5000;
export const TASK_SEARCH_MAX_LENGTH = 100;

export type Task = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate: IsoDate | null;
  readonly assignee: TeamMember | null;
  readonly creator: TeamMember;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

/** Фильтр по ответственному: конкретный участник либо «без ответственного». */
export type AssigneeFilter =
  { readonly kind: "member"; readonly id: string } | { readonly kind: "unassigned" };

/** Значение параметра адресной строки для «без ответственного»: ?assignee=none */
export const UNASSIGNED_PARAM = "none";

export type TaskFilters = {
  readonly search?: string;
  readonly statuses?: readonly TaskStatus[];
  readonly priorities?: readonly TaskPriority[];
  readonly assignee?: AssigneeFilter;
  readonly overdueOnly?: boolean;
};

/**
 * Просрочена ли задача на указанную дату. Завершённые просроченными не считаются.
 * «Сегодня» берётся из todayIso() (src/lib/dates.ts) — в часовом поясе команды.
 */
export function isTaskOverdue(task: Pick<Task, "status" | "dueDate">, today: IsoDate): boolean {
  if (task.dueDate === null || task.status === "done") {
    return false;
  }
  return task.dueDate < today;
}
