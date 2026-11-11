"use client";

import { cn } from "@/components/ui/cn";
import { Select, type SelectOption } from "@/components/ui/select";
import { MemberAvatar } from "@/features/users/components/member-avatar";
import type { IsoDate } from "@/lib/dates";
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task, type TaskStatus } from "../model";
import { DueDateBadge, PriorityBadge, StatusIcon, taskStatusBackground } from "./badges";
import { shownOfTotalLabel } from "./count-labels";
import { HighlightedText } from "./highlighted-text";
import { TaskCardMenu } from "./task-card-menu";
import { useTaskDialogs } from "./task-dialogs";
import { groupTasksByStatus } from "./task-grouping";
import { useTaskWorkspace } from "./task-workspace-context";

const STATUS_OPTIONS: readonly SelectOption<TaskStatus>[] = TASK_STATUSES.map((status) => ({
  value: status,
  label: TASK_STATUS_LABELS[status],
  icon: <StatusIcon status={status} />,
}));

const COLUMN_COUNT = 6;
const HEADER_CELL = "text-muted px-4 py-3 text-sm font-semibold";

/**
 * Список: таблица, сгруппированная по статусам. Статус меняется прямо в строке,
 * у завершённых задач заголовок зачёркнут, внизу — «Показано N из M задач».
 */
export function TaskList() {
  const { tasks, total, today, filters } = useTaskWorkspace();
  const groups = groupTasksByStatus(tasks);

  return (
    <div>
      <div className="rounded-card border-border bg-surface overflow-x-auto border">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <caption className="sr-only">Задачи команды, сгруппированные по статусам</caption>
          <thead>
            <tr className="border-border border-b">
              <th scope="col" className={cn(HEADER_CELL, "w-[38%]")}>
                Задача
              </th>
              <th scope="col" className={HEADER_CELL}>
                Статус
              </th>
              <th scope="col" className={HEADER_CELL}>
                Ответственный
              </th>
              <th scope="col" className={HEADER_CELL}>
                Приоритет
              </th>
              <th scope="col" className={HEADER_CELL}>
                Дедлайн
              </th>
              <th scope="col" className={cn(HEADER_CELL, "w-14")}>
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          {TASK_STATUSES.filter((status) => groups[status].length > 0).map((status) => (
            <StatusGroup
              key={status}
              status={status}
              tasks={groups[status]}
              today={today}
              query={filters.search}
            />
          ))}
        </table>
      </div>
      <p className="text-muted mt-4 text-sm">{shownOfTotalLabel(tasks.length, total)}</p>
    </div>
  );
}

function StatusGroup({
  status,
  tasks,
  today,
  query,
}: {
  readonly status: TaskStatus;
  readonly tasks: readonly Task[];
  readonly today: IsoDate;
  readonly query: string | undefined;
}) {
  return (
    <tbody>
      <tr className={taskStatusBackground(status)}>
        <th scope="colgroup" colSpan={COLUMN_COUNT} className="px-4 py-3">
          <span className="flex items-center gap-2.5 text-lg font-semibold">
            <StatusIcon status={status} className="size-6" />
            {TASK_STATUS_LABELS[status]}
            <span className="text-muted font-normal">
              ({tasks.length})<span className="sr-only"> задач</span>
            </span>
          </span>
        </th>
      </tr>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} today={today} query={query} />
      ))}
    </tbody>
  );
}

function TaskRow({
  task,
  today,
  query,
}: {
  readonly task: Task;
  readonly today: IsoDate;
  readonly query: string | undefined;
}) {
  const { openEdit } = useTaskDialogs();
  const { changeStatus } = useTaskWorkspace();
  const isDone = task.status === "done";

  return (
    <tr className="border-border hover:bg-surface-hover border-b last:border-b-0">
      <td className="max-w-0 px-4 py-3">
        <button
          type="button"
          onClick={() => openEdit(task)}
          aria-haspopup="dialog"
          className={cn(
            "text-body block max-w-full cursor-pointer truncate text-left font-semibold hover:underline",
            isDone && "text-muted line-through",
          )}
        >
          <HighlightedText text={task.title} query={query} />
        </button>
        {task.description ? (
          <p className="text-muted truncate text-sm">
            <HighlightedText text={task.description} query={query} />
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <Select
          options={STATUS_OPTIONS}
          value={task.status}
          onValueChange={(status) => changeStatus(task, status)}
          aria-label={`Статус задачи «${task.title}»`}
          className={cn(
            "h-9 w-44 border-transparent font-medium sm:h-9",
            taskStatusBackground(task.status),
          )}
        />
      </td>
      <td className="px-4 py-3">
        <MemberAvatar member={task.assignee} size="sm" />
      </td>
      <td className="px-4 py-3">
        <PriorityBadge priority={task.priority} />
      </td>
      <td className="px-4 py-3">
        {task.dueDate ? (
          <DueDateBadge task={task} today={today} />
        ) : (
          <span className="text-muted" aria-label="Без дедлайна">
            —
          </span>
        )}
      </td>
      <td className="px-2 py-3 text-right">
        <TaskCardMenu task={task} />
      </td>
    </tr>
  );
}
