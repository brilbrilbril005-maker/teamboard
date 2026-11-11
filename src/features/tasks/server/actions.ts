"use server";

import { refresh } from "next/cache";
import { authedAction } from "@/features/auth/server/authed-action";
import {
  changeTaskStatusSchema,
  createTaskSchema,
  deleteTaskSchema,
  updateTaskSchema,
} from "../schemas";
import { getTaskService } from "./index";

/**
 * Изменения задач. Каждое действие: сессия → проверка ввода → сервис → ActionResult.
 * После успешного изменения refresh() перерисовывает текущую страницу у пользователя
 * свежими данными (задачи не кэшируются, поэтому сбрасывать кэш не нужно).
 */

export const createTaskAction = authedAction(
  "tasks.create",
  createTaskSchema,
  async (data, { user }) => {
    const task = await getTaskService().createTask(user, data);
    refresh();
    return task;
  },
);

export const updateTaskAction = authedAction(
  "tasks.update",
  updateTaskSchema,
  async (data, { user }) => {
    const task = await getTaskService().updateTask(user, data);
    refresh();
    return task;
  },
);

/** Быстрая смена статуса — частный случай изменения задачи. */
export const changeTaskStatusAction = authedAction(
  "tasks.changeStatus",
  changeTaskStatusSchema,
  async ({ id, status }, { user }) => {
    const task = await getTaskService().updateTask(user, { id, changes: { status } });
    refresh();
    return task;
  },
);

export const deleteTaskAction = authedAction(
  "tasks.delete",
  deleteTaskSchema,
  async ({ id }, { user }) => {
    const deleted = await getTaskService().deleteTask(user, id);
    refresh();
    return deleted;
  },
);
