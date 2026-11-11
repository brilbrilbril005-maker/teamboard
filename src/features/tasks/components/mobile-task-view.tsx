"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/components/ui/cn";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task, type TaskStatus } from "../model";
import { StatusIcon, taskStatusBackground } from "./badges";
import { foundTasksLabel } from "./count-labels";
import { SaveStatusIndicator } from "./save-status-indicator";
import { SearchField } from "./search-field";
import { TaskCard } from "./task-card";
import { TaskCardMenu } from "./task-card-menu";
import { useTaskDialogs } from "./task-dialogs";
import { groupTasksByStatus, type TasksByStatus } from "./task-grouping";
import { useTaskWorkspace } from "./task-workspace-context";

const SELECTED_TAB_TEXT: Readonly<Record<TaskStatus, string>> = {
  new: "text-foreground",
  in_progress: "text-primary-text",
  done: "text-success-text",
};

function firstStatusWithTasks(groups: TasksByStatus): TaskStatus {
  return TASK_STATUSES.find((status) => groups[status].length > 0) ?? "new";
}

function MobileCardList({
  tasks,
  showStatus = false,
}: {
  readonly tasks: readonly Task[];
  readonly showStatus?: boolean;
}) {
  const { today, filters } = useTaskWorkspace();
  const { openEdit } = useTaskDialogs();
  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskCard
            task={task}
            today={today}
            query={filters.search}
            showStatus={showStatus}
            markDone
            onOpen={() => openEdit(task)}
            menu={<TaskCardMenu task={task} inlineStatus />}
          />
        </li>
      ))}
    </ul>
  );
}

/** Вкладки-статусы с числами вместо колонок (лист 08). */
export function MobileStatusTabs() {
  const { tasks } = useTaskWorkspace();
  const groups = groupTasksByStatus(tasks);
  const [selected, setSelected] = useState<TaskStatus>(() => firstStatusWithTasks(groups));
  const baseId = useId();
  const tabId = (status: TaskStatus) => `${baseId}-tab-${status}`;
  const panelId = `${baseId}-panel`;

  const moveFocus = (from: TaskStatus, step: number) => {
    const index = TASK_STATUSES.indexOf(from);
    const next = TASK_STATUSES[(index + step + TASK_STATUSES.length) % TASK_STATUSES.length];
    if (next) {
      setSelected(next);
      document.getElementById(tabId(next))?.focus();
    }
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="Статусы задач"
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-2"
      >
        {TASK_STATUSES.map((status) => {
          const isSelected = status === selected;
          return (
            <button
              key={status}
              id={tabId(status)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(status)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveFocus(status, event.key === "ArrowRight" ? 1 : -1);
                }
              }}
              className={cn(
                "rounded-control flex h-10 flex-auto shrink-0 cursor-pointer items-center justify-center gap-1 border px-2 text-[0.8125rem] font-medium whitespace-nowrap transition-colors",
                isSelected
                  ? cn(
                      "border-transparent",
                      taskStatusBackground(status),
                      SELECTED_TAB_TEXT[status],
                    )
                  : "border-border bg-surface text-foreground",
              )}
            >
              <StatusIcon status={status} className="size-4" />
              {TASK_STATUS_LABELS[status]}
              <span className={cn("tabular-nums", isSelected ? "" : "text-muted")}>
                {groups[status].length}
              </span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(selected)} className="pt-2">
        {groups[selected].length > 0 ? (
          <MobileCardList tasks={groups[selected]} />
        ) : (
          <p className="text-muted rounded-card border-border border border-dashed px-4 py-10 text-center">
            В этом статусе задач нет
          </p>
        )}
      </div>
      <CreateTaskFab status={selected} />
    </>
  );
}

/** Режим поиска на телефоне: поле на всю ширину, «Найдена 1 задача», карточки со статусом. */
export function MobileSearch({ onClose }: { readonly onClose: () => void }) {
  const { tasks, filters, search, isNavigating } = useTaskWorkspace();
  const hasQuery = Boolean(filters.search);
  const isTyping = search.draft.trim() !== (filters.search ?? "");

  return (
    <div className="flex flex-col gap-3 pt-1">
      <SearchField
        autoFocus
        alwaysShowClear
        clearLabel="Закрыть поиск"
        onClear={onClose}
        className="border-primary"
      />
      <p role="status" className="text-muted text-sm">
        {isTyping || isNavigating
          ? "Ищем…"
          : hasQuery
            ? foundTasksLabel(tasks.length)
            : "Введите название или описание задачи"}
      </p>
      {hasQuery ? <MobileCardList tasks={tasks} showStatus /> : null}
      <CreateTaskFab />
    </div>
  );
}

export function CreateTaskFab({ status }: { readonly status?: TaskStatus }) {
  const { openCreate } = useTaskDialogs();
  return (
    <>
      <SaveStatusIndicator
        variant="compact"
        className="bg-background/90 fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-4 z-10 rounded-full px-2 py-1 md:hidden"
      />
      <button
        type="button"
        aria-label="Создать задачу"
        onClick={() => openCreate(status ? { status } : undefined)}
        className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-drag fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 flex size-14 cursor-pointer items-center justify-center rounded-full transition-colors md:hidden"
      >
        <Plus aria-hidden="true" className="size-7" />
      </button>
    </>
  );
}
