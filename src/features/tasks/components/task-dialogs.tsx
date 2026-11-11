"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CurrentUser } from "@/features/auth/model";
import type { TeamMember } from "@/features/users/model";
import type { Task, TaskStatus } from "../model";

/**
 * Окна создания, редактирования и удаления задачи.
 *
 * КОНТРАКТ между частями интерфейса: страница оборачивает содержимое в
 * <TaskDialogsProvider>, а доска, список и меню карточки открывают окна только
 * через useTaskDialogs(). Сигнатуры ниже не менять.
 *
 * ЗАГЛУШКА: настоящую реализацию (окна, формы, календарь) пишет отдельный агент.
 */
export type TaskDialogsApi = {
  /** Открыть окно «Новая задача»; status — колонка, из которой нажали «Создать». */
  readonly openCreate: (defaults?: { readonly status?: TaskStatus }) => void;
  readonly openEdit: (task: Task) => void;
  /** Подтверждение удаления. Вызывать только если canDeleteTask(user, task). */
  readonly openDelete: (task: Task) => void;
};

export type TaskDialogsProviderProps = {
  readonly members: readonly TeamMember[];
  readonly currentUser: CurrentUser;
  readonly children: ReactNode;
};

const TaskDialogsContext = createContext<TaskDialogsApi | null>(null);

const noop = () => {};

export function TaskDialogsProvider({ children }: TaskDialogsProviderProps) {
  const api = useMemo<TaskDialogsApi>(
    () => ({ openCreate: noop, openEdit: noop, openDelete: noop }),
    [],
  );
  return <TaskDialogsContext value={api}>{children}</TaskDialogsContext>;
}

export function useTaskDialogs(): TaskDialogsApi {
  const context = useContext(TaskDialogsContext);
  if (!context) {
    throw new Error("TaskDialogsProvider не подключён");
  }
  return context;
}
