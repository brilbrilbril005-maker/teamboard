import { addDaysIso, formatShortDate, type IsoDate } from "@/lib/dates";
import { isTaskOverdue, type Task } from "./model";

/**
 * Как показать дедлайн задачи: «15 нояб.», «Сегодня», «Завтра», «Просрочено · 8 нояб.».
 * Чистая функция: «сегодня» передаётся явно (todayIso() — в часовом поясе команды).
 */
export type DueDateTone = "default" | "soon" | "overdue";

export type DueDateView = {
  readonly tone: DueDateTone;
  readonly label: string;
};

export function describeDueDate(
  task: Pick<Task, "status" | "dueDate">,
  today: IsoDate,
): DueDateView | null {
  const { dueDate } = task;
  if (dueDate === null) {
    return null;
  }
  // Завершённая задача не торопит и не просрочена — дата просто для справки.
  if (task.status === "done") {
    return { tone: "default", label: formatShortDate(dueDate) };
  }
  if (isTaskOverdue(task, today)) {
    return { tone: "overdue", label: `Просрочено · ${formatShortDate(dueDate)}` };
  }
  if (dueDate === today) {
    return { tone: "soon", label: "Сегодня" };
  }
  if (dueDate === addDaysIso(today, 1)) {
    return { tone: "soon", label: "Завтра" };
  }
  return { tone: "default", label: formatShortDate(dueDate) };
}
