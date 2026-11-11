"use client";

import { ChevronDown, Flag, ListFilter, UserRound, UserRoundX } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTeam } from "@/features/users/components/team-context";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type AssigneeFilter,
} from "../model";
import { PriorityDot, StatusIcon } from "./badges";
import { NO_ASSIGNEE_LABEL, isSameAssignee, toggleAssignee, toggleInList } from "./filter-summary";
import { useTaskWorkspace } from "./task-workspace-context";
import { useCloseOnHide } from "./use-close-on-hide";

/** Приоритеты в меню — от высокого к низкому, как читают люди. */
const PRIORITIES_HIGH_FIRST = TASK_PRIORITIES.toReversed();

/** Пункт с несколькими вариантами: меню не закрывается, можно отметить ещё. */
const keepOpen = (event: Event) => event.preventDefault();

function FilterMenu({
  label,
  icon,
  selectedCount,
  children,
}: {
  readonly label: string;
  readonly icon: ReactNode;
  readonly selectedCount: number;
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  useCloseOnHide(setOpen);
  const isActive = selectedCount > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={isActive ? `${label}: выбрано ${selectedCount}` : label}
        className={buttonClassName({
          variant: "secondary",
          className: cn(
            "min-w-0 justify-between font-medium [&_svg]:size-5",
            isActive && "border-primary text-primary-text",
          ),
        })}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
          {isActive ? (
            <span className="bg-primary text-primary-foreground text-caption min-w-5 rounded-full px-1.5 font-semibold">
              {selectedCount}
            </span>
          ) : null}
        </span>
        <ChevronDown aria-hidden="true" className="text-muted ml-1 !size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AssigneeFilterMenu() {
  const { members } = useTeam();
  const { filters, setFilters } = useTaskWorkspace();
  const choose = (assignee: AssigneeFilter) => setFilters(toggleAssignee(filters, assignee));
  const unassigned: AssigneeFilter = { kind: "unassigned" };

  return (
    <FilterMenu
      label="Ответственный"
      icon={<UserRound aria-hidden="true" />}
      selectedCount={filters.assignee ? 1 : 0}
    >
      <DropdownMenuCheckboxItem
        checked={isSameAssignee(filters.assignee, unassigned)}
        onCheckedChange={() => choose(unassigned)}
        icon={<UserRoundX aria-hidden="true" className="text-muted" />}
      >
        {NO_ASSIGNEE_LABEL}
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      {members.map((member) => (
        <DropdownMenuCheckboxItem
          key={member.id}
          checked={isSameAssignee(filters.assignee, { kind: "member", id: member.id })}
          onCheckedChange={() => choose({ kind: "member", id: member.id })}
          icon={<Avatar name={member.name} colorKey={member.id} size="xs" />}
        >
          <span className="truncate">{member.name}</span>
        </DropdownMenuCheckboxItem>
      ))}
    </FilterMenu>
  );
}

export function StatusFilterMenu() {
  const { filters, setFilters } = useTaskWorkspace();

  return (
    <FilterMenu
      label="Статус"
      icon={<Flag aria-hidden="true" />}
      selectedCount={filters.statuses?.length ?? 0}
    >
      {TASK_STATUSES.map((status) => (
        <DropdownMenuCheckboxItem
          key={status}
          checked={filters.statuses?.includes(status) ?? false}
          onSelect={keepOpen}
          onCheckedChange={() =>
            setFilters({
              ...filters,
              statuses: toggleInList(filters.statuses, status, TASK_STATUSES),
            })
          }
          icon={<StatusIcon status={status} />}
        >
          {TASK_STATUS_LABELS[status]}
        </DropdownMenuCheckboxItem>
      ))}
    </FilterMenu>
  );
}

export function PriorityFilterMenu() {
  const { filters, setFilters } = useTaskWorkspace();

  return (
    <FilterMenu
      label="Приоритет"
      icon={<ListFilter aria-hidden="true" />}
      selectedCount={filters.priorities?.length ?? 0}
    >
      {PRIORITIES_HIGH_FIRST.map((priority) => (
        <DropdownMenuCheckboxItem
          key={priority}
          checked={filters.priorities?.includes(priority) ?? false}
          onSelect={keepOpen}
          onCheckedChange={() =>
            setFilters({
              ...filters,
              priorities: toggleInList(filters.priorities, priority, TASK_PRIORITIES),
            })
          }
          icon={<PriorityDot priority={priority} />}
        >
          {TASK_PRIORITY_LABELS[priority]}
        </DropdownMenuCheckboxItem>
      ))}
    </FilterMenu>
  );
}
