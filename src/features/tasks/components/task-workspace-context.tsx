"use client";

import { createContext, useContext } from "react";
import type { IsoDate } from "@/lib/dates";
import type { Task } from "../model";
import type { SearchDraft } from "./use-search-draft";
import type { ChangeTaskStatus } from "./use-task-status-change";
import type { WorkspaceNavigation } from "./use-workspace-navigation";

/**
 * Общее состояние страницы задач для её частей (боковая панель, панель инструментов,
 * доска, список, мобильная версия). Собирается в TaskWorkspace.
 */
export type TaskWorkspaceValue = WorkspaceNavigation & {
  /** Задачи с учётом ещё не подтверждённых сервером смен статуса. */
  readonly tasks: readonly Task[];
  /** Всего задач в команде, без фильтров. */
  readonly total: number;
  readonly countsByAssignee: Readonly<Record<string, number>>;
  /** «Сегодня» в часовом поясе команды — от сервера. */
  readonly today: IsoDate;
  readonly search: SearchDraft;
  readonly changeStatus: ChangeTaskStatus;
};

export const TaskWorkspaceContext = createContext<TaskWorkspaceValue | null>(null);

export function useTaskWorkspace(): TaskWorkspaceValue {
  const context = useContext(TaskWorkspaceContext);
  if (!context) {
    throw new Error("TaskWorkspace не подключён");
  }
  return context;
}
