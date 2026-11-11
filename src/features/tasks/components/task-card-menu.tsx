"use client";

import { Ellipsis, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { useTeam } from "@/features/users/components/team-context";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task } from "../model";
import { canDeleteTask } from "../policy";
import { StatusIcon } from "./badges";
import { isTaskStatus } from "./board-dnd";
import { useTaskDialogs } from "./task-dialogs";
import { useTaskWorkspace } from "./task-workspace-context";
import { useCloseOnHide } from "./use-close-on-hide";

/** Не даём нажатию на кнопку меню начать перетаскивание карточки. */
const stopDragStart = {
  onMouseDown: (event: { stopPropagation: () => void }) => event.stopPropagation(),
  onTouchStart: (event: { stopPropagation: () => void }) => event.stopPropagation(),
};

/**
 * Меню «⋯» задачи: Редактировать, Изменить статус ›, Удалить (только автору).
 * inlineStatus — статусы прямо в меню, без подменю: на телефоне подменю сбоку не помещается.
 */
export function TaskCardMenu({
  task,
  inlineStatus = false,
  className,
}: {
  readonly task: Task;
  readonly inlineStatus?: boolean;
  readonly className?: string;
}) {
  const [open, setOpen] = useState(false);
  useCloseOnHide(setOpen);
  const { currentUser } = useTeam();
  const { openEdit, openDelete } = useTaskDialogs();
  const { changeStatus } = useTaskWorkspace();
  const canDelete = canDeleteTask(currentUser, task);
  const statusItems = (
    <DropdownMenuRadioGroup
      value={task.status}
      onValueChange={(value) => {
        if (isTaskStatus(value)) {
          changeStatus(task, value);
        }
      }}
    >
      {TASK_STATUSES.map((status) => (
        <DropdownMenuRadioItem key={status} value={status} icon={<StatusIcon status={status} />}>
          {TASK_STATUS_LABELS[status]}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <IconButton
          label={`Действия с задачей «${task.title}»`}
          icon={<Ellipsis />}
          size="sm"
          className={cn(
            "data-[state=open]:bg-primary-soft data-[state=open]:text-primary-text",
            className,
          )}
          {...stopDragStart}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem icon={<Pencil aria-hidden="true" />} onSelect={() => openEdit(task)}>
          Редактировать
        </DropdownMenuItem>
        {inlineStatus ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Изменить статус</DropdownMenuLabel>
            {statusItems}
          </>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger icon={<RefreshCw aria-hidden="true" />}>
              Изменить статус
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>{statusItems}</DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="danger"
              icon={<Trash2 aria-hidden="true" />}
              onSelect={() => openDelete(task)}
            >
              Удалить
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
