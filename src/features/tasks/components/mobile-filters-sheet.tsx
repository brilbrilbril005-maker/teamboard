"use client";

import { UserRoundX } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/chip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useTeam } from "@/features/users/components/team-context";
import { shortName } from "@/lib/names";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type AssigneeFilter,
} from "../model";
import { PriorityDot, StatusIcon } from "./badges";
import { showTasksLabel } from "./count-labels";
import { NO_ASSIGNEE_LABEL, isSameAssignee, toggleAssignee, toggleInList } from "./filter-summary";
import { useTaskWorkspace } from "./task-workspace-context";

const PRIORITIES_HIGH_FIRST = TASK_PRIORITIES.toReversed();
const UNASSIGNED: AssigneeFilter = { kind: "unassigned" };

function FilterGroup({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId} className="flex flex-col gap-2.5">
      <h3 id={headingId} className="text-muted text-sm font-semibold">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Фильтры на телефоне — нижняя шторка (лист 08). Выбор применяется сразу,
 * поэтому на кнопке «Показать N задач» всегда точное число.
 */
export function MobileFiltersSheet({
  open,
  onOpenChange,
  onCloseAutoFocus,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Окно открывается не через DialogTrigger, поэтому фокус после закрытия возвращает страница. */
  readonly onCloseAutoFocus: (event: Event) => void;
}) {
  const { members } = useTeam();
  const { filters, setFilters, tasks, isNavigating } = useTaskWorkspace();
  const overdueId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Фильтры" layout="sheet" onCloseAutoFocus={onCloseAutoFocus}>
        <div className="flex flex-col gap-5">
          <FilterGroup title="Статус">
            <div className="flex flex-wrap gap-2">
              {TASK_STATUSES.map((status) => (
                <ToggleChip
                  key={status}
                  pressed={filters.statuses?.includes(status) ?? false}
                  onPressedChange={() =>
                    setFilters({
                      ...filters,
                      statuses: toggleInList(filters.statuses, status, TASK_STATUSES),
                    })
                  }
                  icon={<StatusIcon status={status} className="in-aria-pressed:text-current" />}
                  className="h-10"
                >
                  {TASK_STATUS_LABELS[status]}
                </ToggleChip>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="Ответственный">
            <div className="grid grid-cols-2 gap-2">
              {members.map((member) => {
                const filter = { kind: "member", id: member.id } as const;
                return (
                  <ToggleChip
                    key={member.id}
                    pressed={isSameAssignee(filters.assignee, filter)}
                    onPressedChange={() => setFilters(toggleAssignee(filters, filter))}
                    icon={<Avatar name={member.name} colorKey={member.id} size="sm" />}
                    className="h-11 min-w-0 justify-start"
                  >
                    <span className="truncate">{shortName(member.name)}</span>
                  </ToggleChip>
                );
              })}
              <ToggleChip
                pressed={isSameAssignee(filters.assignee, UNASSIGNED)}
                onPressedChange={() => setFilters(toggleAssignee(filters, UNASSIGNED))}
                icon={<UserRoundX aria-hidden="true" />}
                className="col-span-2 h-11 justify-start"
              >
                {NO_ASSIGNEE_LABEL}
              </ToggleChip>
            </div>
          </FilterGroup>
          <FilterGroup title="Приоритет">
            <div className="flex flex-wrap gap-2">
              {PRIORITIES_HIGH_FIRST.map((priority) => (
                <ToggleChip
                  key={priority}
                  pressed={filters.priorities?.includes(priority) ?? false}
                  onPressedChange={() =>
                    setFilters({
                      ...filters,
                      priorities: toggleInList(filters.priorities, priority, TASK_PRIORITIES),
                    })
                  }
                  icon={<PriorityDot priority={priority} />}
                  className="h-10"
                >
                  {TASK_PRIORITY_LABELS[priority]}
                </ToggleChip>
              ))}
            </div>
          </FilterGroup>
          <div className="border-border flex items-center justify-between gap-4 border-t pt-4">
            <label htmlFor={overdueId} className="text-body cursor-pointer">
              Только просроченные
            </label>
            <Switch
              id={overdueId}
              checked={filters.overdueOnly ?? false}
              onCheckedChange={(overdueOnly) => setFilters({ ...filters, overdueOnly })}
            />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" loading={isNavigating} onClick={() => onOpenChange(false)}>
            {showTasksLabel(tasks.length)}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => setFilters({ search: filters.search })}>
            Сбросить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
