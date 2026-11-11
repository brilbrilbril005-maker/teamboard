"use client";

import { startTransition, useCallback } from "react";
import { toast } from "@/components/ui/toast";
import { TASK_STATUS_LABELS, type Task, type TaskStatus } from "../model";
import { changeTaskStatusAction } from "../server/actions";
import { useTrackMutation } from "./save-status";
import type { StatusChange } from "./task-grouping";

export type ChangeTaskStatus = (task: Task, status: TaskStatus) => void;

type StatusChangeDeps = {
  readonly applyOptimistic: (change: StatusChange) => void;
  readonly track: ReturnType<typeof useTrackMutation>;
};

function statusToastId(taskId: string): string {
  return `task-status-${taskId}`;
}

function saveStatus(deps: StatusChangeDeps, task: Task, status: TaskStatus, isUndo: boolean) {
  if (task.status === status) {
    return;
  }
  // Запрос и индикатор «Сохранение…» запускаем вне перехода: обновления состояния внутри
  // асинхронного перехода React показывает только после его завершения.
  const saving = deps.track(changeTaskStatusAction({ id: task.id, status }));
  startTransition(async () => {
    deps.applyOptimistic({ id: task.id, status });
    const result = await saving;
    const toastId = statusToastId(task.id);
    if (!result.ok) {
      toast.error(result.error.message, { id: toastId });
      return;
    }
    const label = TASK_STATUS_LABELS[status];
    if (isUndo) {
      toast.success(`Статус возвращён: «${label}».`, { id: toastId });
      return;
    }
    toast.success(`Статус изменён на «${label}».`, {
      id: toastId,
      action: {
        label: "Отменить",
        onClick: () => saveStatus(deps, result.data, task.status, true),
      },
    });
  });
}

/**
 * Быстрая смена статуса (перетаскивание, меню «⋯», выпадающий список в строке).
 * Карточка переезжает сразу (оптимистично); если сервер отказал — возвращается
 * на место, и появляется уведомление с причиной. После успеха — «Отменить».
 */
export function useTaskStatusChange(
  applyOptimistic: (change: StatusChange) => void,
): ChangeTaskStatus {
  const track = useTrackMutation();
  return useCallback<ChangeTaskStatus>(
    (task, status) => saveStatus({ applyOptimistic, track }, task, status, false),
    [applyOptimistic, track],
  );
}
