import "server-only";
import { requireUser } from "@/features/auth/server/session";
import type { TaskBoard, TaskFilters } from "../model";
import { getTaskService } from "./index";

/**
 * Данные страницы задач. Только для вошедших; не кэшируется — команда видит свежее.
 * Вызывать из асинхронного компонента внутри <Suspense>.
 */
export async function getTaskBoard(filters: TaskFilters): Promise<TaskBoard> {
  await requireUser();
  return getTaskService().getTaskBoard(filters);
}
