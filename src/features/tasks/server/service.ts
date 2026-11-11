import "server-only";
import type { CurrentUser } from "@/features/auth/model";
import type { UserRepository } from "@/features/users/server/repository";
import { todayIso } from "@/lib/dates";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { RateLimiter, RateLimitRule } from "@/lib/server/rate-limit";
import type { Task, TaskBoard, TaskFilters } from "../model";
import { canDeleteTask, canEditTask } from "../policy";
import type { CreateTaskData, UpdateTaskData } from "../schemas";
import type { TaskRepository } from "./repository";

/**
 * Мягкий потолок изменений задач на одного пользователя: обычной работе он не мешает,
 * а скрипт, засыпающий сервер запросами, остановит.
 */
export const TASK_MUTATION_RATE_LIMIT: RateLimitRule = { limit: 120, windowSeconds: 60 };

const TASK_NOT_FOUND_MESSAGE = "Задача не найдена";
const MEMBER_NOT_FOUND_MESSAGE = "Участник не найден";
const EDIT_FORBIDDEN_MESSAGE = "Недостаточно прав, чтобы изменить задачу";
const DELETE_FORBIDDEN_MESSAGE = "Удалить задачу может только её автор";

type TaskServiceDeps = {
  readonly taskRepository: TaskRepository;
  readonly userRepository: Pick<UserRepository, "findTeamMemberById">;
  readonly rateLimiter: RateLimiter;
  /** Текущее время; в тестах подменяется, чтобы проверить «сегодня» и просрочку. */
  readonly now?: () => Date;
};

export function createTaskService({
  taskRepository,
  userRepository,
  rateLimiter,
  now = () => new Date(),
}: TaskServiceDeps) {
  async function requireTask(id: string): Promise<Task> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError(TASK_NOT_FOUND_MESSAGE);
    }
    return task;
  }

  /** Ответственным можно назначить только участника команды. null — «без ответственного». */
  async function ensureAssigneeExists(assigneeId: string | null | undefined): Promise<void> {
    if (!assigneeId || (await userRepository.findTeamMemberById(assigneeId))) {
      return;
    }
    throw new ValidationError(MEMBER_NOT_FOUND_MESSAGE, {
      assigneeId: [MEMBER_NOT_FOUND_MESSAGE],
    });
  }

  async function consumeMutation(user: CurrentUser): Promise<void> {
    await rateLimiter.consume(`tasks:mutate:${user.id}`, TASK_MUTATION_RATE_LIMIT, now());
  }

  /** Создавать и менять задачи может любой участник (policy.ts); изменение идёт в счётчик. */
  async function consumeEdit(user: CurrentUser): Promise<void> {
    if (!canEditTask(user)) {
      throw new ForbiddenError(EDIT_FORBIDDEN_MESSAGE);
    }
    await consumeMutation(user);
  }

  async function listTasks(filters: TaskFilters): Promise<Task[]> {
    return taskRepository.list(filters, todayIso(now()));
  }

  return {
    listTasks,

    getTask: requireTask,

    /** Всё для страницы задач. Счётчики считаются без фильтров — это сведения о команде. */
    async getTaskBoard(filters: TaskFilters): Promise<TaskBoard> {
      const today = todayIso(now());
      const [list, total, countsByAssignee] = await Promise.all([
        taskRepository.list(filters, today),
        taskRepository.countAll(),
        taskRepository.countByAssignee(),
      ]);
      return { tasks: list, total, countsByAssignee, today };
    },

    async createTask(user: CurrentUser, data: CreateTaskData): Promise<Task> {
      await consumeEdit(user);
      await ensureAssigneeExists(data.assigneeId);
      return taskRepository.create({ ...data, creatorId: user.id });
    },

    /** Любое изменение задачи, в том числе быстрая смена статуса. */
    async updateTask(user: CurrentUser, { id, changes }: UpdateTaskData): Promise<Task> {
      await consumeEdit(user);
      await requireTask(id);
      await ensureAssigneeExists(changes.assigneeId);
      const updated = await taskRepository.update(id, changes);
      if (!updated) {
        // Задачу удалили между проверкой и сохранением.
        throw new NotFoundError(TASK_NOT_FOUND_MESSAGE);
      }
      return updated;
    },

    async deleteTask(user: CurrentUser, id: string): Promise<{ id: string }> {
      await consumeMutation(user);
      const task = await requireTask(id);
      if (!canDeleteTask(user, task)) {
        throw new ForbiddenError(DELETE_FORBIDDEN_MESSAGE);
      }
      if (!(await taskRepository.delete(id))) {
        throw new NotFoundError(TASK_NOT_FOUND_MESSAGE);
      }
      return { id };
    },
  };
}

export type TaskService = ReturnType<typeof createTaskService>;
