import type { TeamMember } from "@/features/users/model";

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

/** Дата без времени в формате ГГГГ-ММ-ДД. Так дедлайн не «съезжает» из-за часовых поясов. */
export type IsoDate = string;

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

/** Значение фильтра «без ответственного». */
export const UNASSIGNED_FILTER = "none";

export type TaskFilters = {
  readonly search?: string;
  readonly statuses?: readonly TaskStatus[];
  readonly priorities?: readonly TaskPriority[];
  /** Идентификатор участника либо UNASSIGNED_FILTER. */
  readonly assigneeId?: string;
  readonly overdueOnly?: boolean;
};

/** Просрочена ли задача на указанную дату. Завершённые просроченными не считаются. */
export function isTaskOverdue(task: Pick<Task, "status" | "dueDate">, today: IsoDate): boolean {
  if (task.dueDate === null || task.status === "done") {
    return false;
  }
  return task.dueDate < today;
}

/** Сегодняшняя дата в формате ГГГГ-ММ-ДД в указанном часовом поясе. */
export function toIsoDate(date: Date, timeZone?: string): IsoDate {
  // Локаль en-CA даёт формат ГГГГ-ММ-ДД.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
