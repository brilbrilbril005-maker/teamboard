import type { TaskFilters } from "../model";
import { serializeTaskFilters, type TaskSearchParams } from "../schemas";

/**
 * Состояние страницы задач в адресной строке: фильтры (см. schemas.ts) и вид «Доска | Список».
 * Ссылкой можно поделиться, а после перезагрузки всё остаётся на месте.
 *   /?status=new,in_progress&assignee=<id>&view=list
 */

export const TASK_VIEWS = ["board", "list"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];
export const DEFAULT_TASK_VIEW: TaskView = "board";

const VIEW_PARAM = "view";

export type WorkspaceState = {
  readonly filters: TaskFilters;
  readonly view: TaskView;
};

/** Вид из адреса; неизвестное значение — доска. */
export function parseTaskView(params: TaskSearchParams): TaskView {
  const raw = params[VIEW_PARAM];
  const value = typeof raw === "string" ? raw : raw?.[0];
  return TASK_VIEWS.find((view) => view === value) ?? DEFAULT_TASK_VIEW;
}

/**
 * Адрес страницы для состояния. Вид по умолчанию и пустые фильтры не пишутся.
 * Запятые оставлены как есть (status=new,done) — так ссылка читается глазами.
 */
export function workspaceHref(pathname: string, state: WorkspaceState): string {
  const params = new URLSearchParams({
    ...serializeTaskFilters(state.filters),
    ...(state.view === DEFAULT_TASK_VIEW ? {} : { [VIEW_PARAM]: state.view }),
  });
  const query = params.toString().replaceAll("%2C", ",");
  return query ? `${pathname}?${query}` : pathname;
}
