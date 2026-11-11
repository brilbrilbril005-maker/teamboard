import "server-only";
import { getDb } from "@/db/client";
import { getUserRepository } from "@/features/users/server";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { createTaskRepository } from "./repository";
import { createTaskService, type TaskService } from "./service";

/** Сборка модуля задач: база и соседние модули соединяются с сервисом. */

let taskService: TaskService | undefined;

export function getTaskService(): TaskService {
  if (!taskService) {
    const db = getDb();
    taskService = createTaskService({
      taskRepository: createTaskRepository(db),
      userRepository: getUserRepository(),
      rateLimiter: createRateLimiter(db),
    });
  }
  return taskService;
}
