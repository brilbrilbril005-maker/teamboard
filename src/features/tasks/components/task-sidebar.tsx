"use client";

import { Layers, UserRound, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { Logo } from "@/components/ui/logo";
import { useTeam } from "@/features/users/components/team-context";
import { shortName } from "@/lib/names";
import { tasksCountLabel } from "./count-labels";
import { isSameAssignee, toggleAssignee, withoutFilter } from "./filter-summary";
import { useTaskWorkspace } from "./task-workspace-context";
import { WORKSPACE_SIDEBAR_CLASS_NAME } from "./workspace-layout";

const ITEM_CLASS_NAME =
  "rounded-control text-body flex h-11 w-full cursor-pointer items-center gap-3 px-3 text-left transition-colors hover:bg-surface-muted aria-pressed:bg-primary-soft aria-pressed:font-semibold aria-pressed:text-foreground";

function NavItem({
  icon: Icon,
  pressed,
  onClick,
  children,
}: {
  readonly icon: LucideIcon;
  readonly pressed: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={ITEM_CLASS_NAME}>
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      {children}
    </button>
  );
}

/**
 * Левая панель (от 1024px): «Все задачи», «Мои задачи» и команда с числом задач.
 * Щелчок по участнику — фильтр по ответственному; повторный щелчок снимает его.
 */
export function TaskSidebar() {
  const { currentUser, members } = useTeam();
  const { filters, setFilters, countsByAssignee } = useTaskWorkspace();
  const teamHeadingId = useId();
  const mine = { kind: "member", id: currentUser.id } as const;

  return (
    <aside aria-label="Разделы" className={WORKSPACE_SIDEBAR_CLASS_NAME}>
      <Logo className="px-3" />
      <nav aria-label="Задачи" className="mt-8">
        <ul className="flex flex-col gap-1">
          <li>
            <NavItem
              icon={Layers}
              pressed={!filters.assignee}
              onClick={() => setFilters(withoutFilter(filters, "assignee"))}
            >
              Все задачи
            </NavItem>
          </li>
          <li>
            <NavItem
              icon={UserRound}
              pressed={isSameAssignee(filters.assignee, mine)}
              onClick={() => setFilters(toggleAssignee(filters, mine))}
            >
              Мои задачи
            </NavItem>
          </li>
        </ul>
      </nav>
      <hr className="border-border mx-3 my-5" />
      <section aria-labelledby={teamHeadingId}>
        <h2 id={teamHeadingId} className="text-muted mb-2 px-3 text-sm font-semibold">
          Команда
        </h2>
        <ul className="flex flex-col gap-1">
          {members.map((member) => {
            const count = countsByAssignee[member.id] ?? 0;
            const filter = { kind: "member", id: member.id } as const;
            return (
              <li key={member.id}>
                <button
                  type="button"
                  aria-pressed={isSameAssignee(filters.assignee, filter)}
                  onClick={() => setFilters(toggleAssignee(filters, filter))}
                  title={member.name}
                  className={cn(ITEM_CLASS_NAME, "h-12")}
                >
                  <Avatar name={member.name} colorKey={member.id} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{shortName(member.name)}</span>
                  <span aria-hidden="true" className="text-muted tabular-nums">
                    {count}
                  </span>
                  <span className="sr-only">, {tasksCountLabel(count)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
