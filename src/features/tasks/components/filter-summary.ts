import type { TeamMember } from "@/features/users/model";
import { shortName } from "@/lib/names";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type AssigneeFilter,
  type TaskFilters,
} from "../model";

/**
 * Работа с фильтрами в интерфейсе: чипы активных фильтров, снятие одного фильтра,
 * переключение значений. Всё возвращает новые объекты — исходные не меняются.
 */

export type FilterKey = keyof TaskFilters;

export const NO_ASSIGNEE_LABEL = "Без ответственного";

/** Убирает пустые значения, чтобы адрес и сравнение фильтров были однозначными. */
export function normalizeFilters(filters: TaskFilters): TaskFilters {
  const search = filters.search?.trim();
  return {
    ...(search ? { search } : {}),
    ...(filters.statuses?.length ? { statuses: filters.statuses } : {}),
    ...(filters.priorities?.length ? { priorities: filters.priorities } : {}),
    ...(filters.assignee ? { assignee: filters.assignee } : {}),
    ...(filters.overdueOnly ? { overdueOnly: true } : {}),
  };
}

export function hasActiveFilters(filters: TaskFilters): boolean {
  return Object.keys(normalizeFilters(filters)).length > 0;
}

/** Сколько групп фильтров включено (без поиска) — число на кнопке мобильных фильтров. */
export function countActiveFilterGroups(filters: TaskFilters): number {
  const { search: _search, ...rest } = normalizeFilters(filters);
  return Object.keys(rest).length;
}

export function withoutFilter(filters: TaskFilters, key: FilterKey): TaskFilters {
  const { [key]: _removed, ...rest } = filters;
  return normalizeFilters(rest);
}

/**
 * Добавляет значение в список или убирает его. Порядок — как в model.ts,
 * поэтому одна и та же выборка всегда даёт один и тот же адрес.
 */
export function toggleInList<T extends string>(
  list: readonly T[] | undefined,
  value: T,
  order: readonly T[],
): readonly T[] {
  const current = list ?? [];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return order.filter((item) => next.includes(item));
}

export function isSameAssignee(a: AssigneeFilter | undefined, b: AssigneeFilter): boolean {
  if (!a || a.kind !== b.kind) {
    return false;
  }
  return a.kind === "unassigned" || (b.kind === "member" && a.id === b.id);
}

/** Выбрать ответственного или снять выбор, если он уже выбран. */
export function toggleAssignee(filters: TaskFilters, assignee: AssigneeFilter): TaskFilters {
  return normalizeFilters({
    ...filters,
    assignee: isSameAssignee(filters.assignee, assignee) ? undefined : assignee,
  });
}

export function assigneeFilterLabel(
  filter: AssigneeFilter,
  members: readonly Pick<TeamMember, "id" | "name">[],
): string {
  if (filter.kind === "unassigned") {
    return NO_ASSIGNEE_LABEL;
  }
  const member = members.find((candidate) => candidate.id === filter.id);
  return member ? shortName(member.name) : "Участник не найден";
}

export type FilterChipView = { readonly key: FilterKey; readonly label: string };

/**
 * Чипы активных фильтров под панелью инструментов: «Ответственный: Анна С. ×».
 * Поиск и «Просроченные» здесь не показываются — у них свои видимые поля.
 */
export function describeFilterChips(
  filters: TaskFilters,
  members: readonly Pick<TeamMember, "id" | "name">[],
): readonly FilterChipView[] {
  const chips: FilterChipView[] = [];
  if (filters.assignee) {
    chips.push({
      key: "assignee",
      label: `Ответственный: ${assigneeFilterLabel(filters.assignee, members)}`,
    });
  }
  if (filters.statuses?.length) {
    const labels = TASK_STATUSES.filter((status) => filters.statuses?.includes(status)).map(
      (status) => TASK_STATUS_LABELS[status],
    );
    chips.push({ key: "statuses", label: `Статус: ${labels.join(", ")}` });
  }
  if (filters.priorities?.length) {
    const labels = TASK_PRIORITIES.filter((priority) => filters.priorities?.includes(priority))
      .toReversed()
      .map((priority) => TASK_PRIORITY_LABELS[priority]);
    chips.push({ key: "priorities", label: `Приоритет: ${labels.join(", ")}` });
  }
  return chips;
}
