"use client";

import { useCallback, useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";
import type { TaskBoard as TaskBoardData, TaskFilters } from "../model";
import { countActiveFilterGroups } from "./filter-summary";
import { MobileFiltersSheet } from "./mobile-filters-sheet";
import { CreateTaskFab, MobileSearch, MobileStatusTabs } from "./mobile-task-view";
import { TaskBoard } from "./task-board";
import { applyStatusChange } from "./task-grouping";
import { TaskList } from "./task-list";
import { TaskSidebar } from "./task-sidebar";
import { TaskToolbar } from "./task-toolbar";
import {
  TaskWorkspaceContext,
  useTaskWorkspace,
  type TaskWorkspaceValue,
} from "./task-workspace-context";
import { useCloseOnHide } from "./use-close-on-hide";
import { useSearchDraft } from "./use-search-draft";
import { useTaskStatusChange } from "./use-task-status-change";
import { useWorkspaceNavigation } from "./use-workspace-navigation";
import { DesktopHeader, MobileHeader, MobileTitleRow, PAGE_TITLE } from "./workspace-header";
import { WORKSPACE_CONTENT_CLASS_NAME } from "./workspace-layout";
import { EmptyBoardState, NoResultsState } from "./workspace-states";
import type { TaskView } from "./workspace-url";

export type TaskWorkspaceProps = {
  readonly board: TaskBoardData;
  /** Фильтры и вид, разобранные сервером из адреса. */
  readonly filters: TaskFilters;
  readonly view: TaskView;
};

/**
 * Страница задач целиком: боковая панель, шапка, панель инструментов, доска или список;
 * на телефоне (до 768px) — компактная шапка, вкладки-статусы, шторка фильтров и поиск.
 * Обе раскладки в разметке, нужную показывает CSS — так сервер сразу отдаёт верную страницу.
 */
export function TaskWorkspace({ board, filters, view }: TaskWorkspaceProps) {
  const navigation = useWorkspaceNavigation({ filters, view });
  const [tasks, applyOptimisticStatus] = useOptimistic(board.tasks, applyStatusChange);
  const changeStatus = useTaskStatusChange(applyOptimisticStatus);
  const { filters: currentFilters, setFilters } = navigation;
  const commitSearch = useCallback(
    (search: string) => setFilters({ ...currentFilters, search }),
    [currentFilters, setFilters],
  );
  const search = useSearchDraft(currentFilters.search ?? "", commitSearch);

  const value = useMemo<TaskWorkspaceValue>(
    () => ({
      ...navigation,
      tasks,
      total: board.total,
      countsByAssignee: board.countsByAssignee,
      today: board.today,
      search,
      changeStatus,
    }),
    [navigation, tasks, board, search, changeStatus],
  );

  return (
    <TaskWorkspaceContext value={value}>
      <div className="lg:pl-68">
        <TaskSidebar />
        <div className={WORKSPACE_CONTENT_CLASS_NAME}>
          <DesktopHeader />
          <MobileWorkspace />
          <div className="hidden md:block">
            <TaskToolbar />
            <main
              aria-busy={navigation.isNavigating}
              className={cn("transition-opacity", navigation.isNavigating && "opacity-60")}
            >
              <DesktopContent />
            </main>
          </div>
        </div>
      </div>
    </TaskWorkspaceContext>
  );
}

function useEmptyState() {
  const { tasks, total, setFilters } = useTaskWorkspace();
  if (total === 0) {
    return <EmptyBoardState />;
  }
  if (tasks.length === 0) {
    return <NoResultsState onReset={() => setFilters({})} />;
  }
  return null;
}

function DesktopContent() {
  const { view } = useTaskWorkspace();
  const emptyState = useEmptyState();
  if (emptyState) {
    return emptyState;
  }
  return view === "list" ? <TaskList /> : <TaskBoard />;
}

function MobileWorkspace() {
  const { filters, isNavigating, search } = useTaskWorkspace();
  const [isSearchOpen, setSearchOpen] = useState(Boolean(filters.search));
  const [isFiltersOpen, setFiltersOpen] = useState(false);
  useCloseOnHide(setFiltersOpen);
  const emptyState = useEmptyState();
  const showSearch = isSearchOpen || Boolean(filters.search);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const restoreSearchFocusRef = useRef(false);

  // Кнопка «Поиск задач» появляется снова только после закрытия поиска — тогда и ставим фокус.
  useEffect(() => {
    if (!showSearch && restoreSearchFocusRef.current) {
      restoreSearchFocusRef.current = false;
      searchButtonRef.current?.focus();
    }
  }, [showSearch]);

  const closeSearch = () => {
    restoreSearchFocusRef.current = true;
    search.clear();
    setSearchOpen(false);
  };

  const focusFiltersButton = (event: Event) => {
    event.preventDefault();
    filtersButtonRef.current?.focus();
  };

  return (
    <div className="md:hidden">
      <MobileHeader
        isSearchOpen={showSearch}
        onOpenSearch={() => setSearchOpen(true)}
        searchButtonRef={searchButtonRef}
      />
      <main aria-busy={isNavigating}>
        {showSearch ? (
          <h1 className="sr-only">{PAGE_TITLE}</h1>
        ) : (
          <MobileTitleRow
            activeFilterCount={countActiveFilterGroups(filters)}
            onOpenFilters={() => setFiltersOpen(true)}
            filtersButtonRef={filtersButtonRef}
          />
        )}
        <div className={cn("transition-opacity", isNavigating && !showSearch && "opacity-60")}>
          {showSearch ? (
            <MobileSearch onClose={closeSearch} />
          ) : emptyState ? (
            <>
              {emptyState}
              <CreateTaskFab />
            </>
          ) : (
            <MobileStatusTabs />
          )}
        </div>
      </main>
      <MobileFiltersSheet
        open={isFiltersOpen}
        onOpenChange={setFiltersOpen}
        onCloseAutoFocus={focusFiltersButton}
      />
    </div>
  );
}
