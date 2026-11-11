"use client";

import { Funnel, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChip, ToggleChip } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useTeam } from "@/features/users/components/team-context";
import { describeFilterChips, hasActiveFilters, withoutFilter } from "./filter-summary";
import { AssigneeFilterMenu, PriorityFilterMenu, StatusFilterMenu } from "./filter-menus";
import { SearchField } from "./search-field";
import { useTaskDialogs } from "./task-dialogs";
import { useTaskWorkspace } from "./task-workspace-context";
import type { TaskView } from "./workspace-url";

const VIEW_OPTIONS: readonly { readonly value: TaskView; readonly label: string }[] = [
  { value: "board", label: "Доска" },
  { value: "list", label: "Список" },
];

/**
 * Панель инструментов (от 768px): «Создать задачу», поиск, фильтры, «Просроченные»,
 * чипы активных фильтров со «Сбросить фильтры» и переключатель «Доска | Список».
 */
export function TaskToolbar() {
  const { members } = useTeam();
  const { openCreate } = useTaskDialogs();
  const { filters, setFilters, view, setView } = useTaskWorkspace();
  const chips = describeFilterChips(filters, members);

  return (
    <section aria-label="Поиск и фильтры" className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button icon={<Plus aria-hidden="true" />} onClick={() => openCreate()}>
          Создать задачу
        </Button>
        <SearchField containerClassName="min-w-56 flex-1 basis-64" />
        <AssigneeFilterMenu />
        <StatusFilterMenu />
        <PriorityFilterMenu />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {chips.map((chip) => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            onRemove={() => setFilters(withoutFilter(filters, chip.key))}
            className="max-w-80"
          />
        ))}
        {hasActiveFilters(filters) ? (
          <Button variant="ghost" onClick={() => setFilters({})}>
            Сбросить фильтры
          </Button>
        ) : null}
        <ToggleChip
          pressed={filters.overdueOnly ?? false}
          onPressedChange={(overdueOnly) => setFilters({ ...filters, overdueOnly })}
          icon={<Funnel aria-hidden="true" />}
          className="h-10"
        >
          Просроченные
        </ToggleChip>
        <SegmentedControl
          aria-label="Вид задач"
          options={VIEW_OPTIONS}
          value={view}
          onValueChange={setView}
          className="ml-auto"
        />
      </div>
    </section>
  );
}
