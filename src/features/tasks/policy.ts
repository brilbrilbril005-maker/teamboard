import type { CurrentUser } from "@/features/auth/model";
import type { Task } from "./model";

/**
 * Правила доступа к задачам. Чистые функции: их вызывает сервис
 * (для настоящей проверки) и интерфейс (чтобы спрятать недоступные кнопки).
 * Интерфейс только подсказывает — решает всегда сервер.
 */

type TaskOwnership = { readonly creator: Pick<Task["creator"], "id"> };

/** Команда общая: смотреть и менять задачи может любой участник. */
export function canEditTask(user: Pick<CurrentUser, "id"> | null): boolean {
  return user !== null;
}

/** Удалить задачу может только её автор. */
export function canDeleteTask(user: Pick<CurrentUser, "id"> | null, task: TaskOwnership): boolean {
  return user !== null && user.id === task.creator.id;
}
