import type { Task, TaskStatus } from "../model";

/** Задачи по статусам — колонки доски, группы списка, вкладки на телефоне. */
export type TasksByStatus = Readonly<Record<TaskStatus, readonly Task[]>>;

/** Раскладывает задачи по статусам, сохраняя серверный порядок внутри каждой группы. */
export function groupTasksByStatus(tasks: readonly Task[]): TasksByStatus {
  const withStatus = (status: TaskStatus) => tasks.filter((task) => task.status === status);
  return {
    new: withStatus("new"),
    in_progress: withStatus("in_progress"),
    done: withStatus("done"),
  };
}

export type StatusChange = { readonly id: string; readonly status: TaskStatus };

/**
 * Оптимистичная смена статуса: возвращает новый список, исходный не меняется.
 * Задача остаётся на своём месте в общем порядке — сервер сортирует не по статусу,
 * поэтому после обновления данных карточка не «прыгает».
 */
export function applyStatusChange(tasks: readonly Task[], change: StatusChange): readonly Task[] {
  return tasks.map((task) =>
    task.id === change.id && task.status !== change.status
      ? { ...task, status: change.status }
      : task,
  );
}
