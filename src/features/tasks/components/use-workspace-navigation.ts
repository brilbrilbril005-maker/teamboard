"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useOptimistic, useTransition } from "react";
import type { TaskFilters } from "../model";
import { normalizeFilters } from "./filter-summary";
import { workspaceHref, type TaskView, type WorkspaceState } from "./workspace-url";

export type WorkspaceNavigation = {
  /** Выбранное пользователем — сразу, не дожидаясь ответа сервера. */
  readonly filters: TaskFilters;
  readonly view: TaskView;
  /** Сервер ещё готовит данные для нового адреса. */
  readonly isNavigating: boolean;
  readonly setFilters: (filters: TaskFilters) => void;
  readonly setView: (view: TaskView) => void;
};

/**
 * Фильтры и вид живут в адресной строке. Изменение — router.replace без прокрутки
 * (история браузера не засоряется каждым щелчком по фильтру), а useOptimistic
 * показывает новый выбор мгновенно, пока сервер готовит отфильтрованные задачи.
 */
export function useWorkspaceNavigation(current: WorkspaceState): WorkspaceNavigation {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigation] = useTransition();
  const [state, setOptimisticState] = useOptimistic(current);

  const navigate = useCallback(
    (next: WorkspaceState) => {
      startNavigation(() => {
        setOptimisticState(next);
        router.replace(workspaceHref(pathname, next), { scroll: false });
      });
    },
    [pathname, router, setOptimisticState],
  );

  return useMemo(
    () => ({
      filters: state.filters,
      view: state.view,
      isNavigating,
      setFilters: (filters: TaskFilters) =>
        navigate({ ...state, filters: normalizeFilters(filters) }),
      setView: (view: TaskView) => navigate({ ...state, view }),
    }),
    [state, isNavigating, navigate],
  );
}
