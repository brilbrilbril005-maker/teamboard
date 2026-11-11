"use client";

import { useRef, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import type { Task } from "../model";
import { deleteTaskAction } from "../server/actions";
import { useTrackMutation } from "./save-status";
import { runTaskMutation } from "./task-dialog-mutation";

/** Ошибки, после которых повторять бессмысленно: задачи уже нет или удалять нельзя. */
const CLOSING_ERROR_CODES = new Set(["NOT_FOUND", "FORBIDDEN"]);

export type DeleteTaskDialogProps = {
  readonly task: Pick<Task, "id" | "title">;
  readonly onClose: () => void;
};

/** «Удалить задачу?» — подтверждение необратимого удаления. */
export function DeleteTaskDialog({ task, onClose }: DeleteTaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const track = useTrackMutation();

  const handleConfirm = () => {
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    startTransition(async () => {
      const result = await runTaskMutation(track, () => deleteTaskAction({ id: task.id }));
      submittingRef.current = false;
      if (result.ok) {
        toast.success("Задача удалена");
        onClose();
        return;
      }
      toast.error(result.error.message);
      if (CLOSING_ERROR_CODES.has(result.error.code)) {
        onClose();
      }
    });
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title="Удалить задачу?"
      description={
        <>
          Задача <span className="[overflow-wrap:anywhere]">«{task.title}»</span> будет удалена без
          возможности восстановления.
        </>
      }
      confirmLabel="Удалить"
      pendingLabel="Удаление…"
      pending={isPending}
      onConfirm={handleConfirm}
    />
  );
}
