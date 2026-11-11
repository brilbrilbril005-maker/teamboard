import { z } from "zod";
import { hasNoNulCharacter, INVALID_CHARACTERS_MESSAGE, stripNulCharacters } from "@/lib/text";
import {
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_SEARCH_MAX_LENGTH,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
  UNASSIGNED_PARAM,
  type AssigneeFilter,
  type TaskFilters,
} from "./model";

/** Проверки ввода для задач. Одни и те же правила работают в форме и на сервере. */

const taskIdSchema = z.uuid("Некорректный идентификатор задачи");

const titleSchema = z
  .string()
  .trim()
  .min(1, "Введите название задачи")
  .refine(hasNoNulCharacter, INVALID_CHARACTERS_MESSAGE)
  .max(TASK_TITLE_MAX_LENGTH, `Название — не длиннее ${TASK_TITLE_MAX_LENGTH} символов`);

const descriptionSchema = z
  .string()
  .trim()
  .refine(hasNoNulCharacter, INVALID_CHARACTERS_MESSAGE)
  .max(
    TASK_DESCRIPTION_MAX_LENGTH,
    `Описание — не длиннее ${TASK_DESCRIPTION_MAX_LENGTH} символов`,
  );

const statusSchema = z.enum(TASK_STATUSES, "Неизвестный статус");
const prioritySchema = z.enum(TASK_PRIORITIES, "Неизвестный приоритет");
const dueDateSchema = z.iso.date("Укажите дату в формате ГГГГ-ММ-ДД").nullable();
const assigneeIdSchema = z.uuid("Некорректный ответственный").nullable();

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.default(""),
  status: statusSchema.default(DEFAULT_TASK_STATUS),
  priority: prioritySchema.default(DEFAULT_TASK_PRIORITY),
  dueDate: dueDateSchema.default(null),
  assigneeId: assigneeIdSchema.default(null),
});

const taskChangesSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    status: statusSchema,
    priority: prioritySchema,
    dueDate: dueDateSchema,
    assigneeId: assigneeIdSchema,
  })
  .partial()
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    message: "Нет изменений для сохранения",
  });

export const updateTaskSchema = z.object({
  id: taskIdSchema,
  changes: taskChangesSchema,
});

/**
 * Быстрая смена статуса (перетаскивание карточки, меню «⋯»). Это частный случай
 * изменения задачи: в сервисе обе схемы приводят к одному методу update.
 */
export const changeTaskStatusSchema = z.object({
  id: taskIdSchema,
  status: statusSchema,
});

export const deleteTaskSchema = z.object({
  id: taskIdSchema,
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type CreateTaskData = z.output<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
export type UpdateTaskData = z.output<typeof updateTaskSchema>;
export type TaskChanges = UpdateTaskData["changes"];
export type ChangeTaskStatusInput = z.input<typeof changeTaskStatusSchema>;
export type DeleteTaskInput = z.input<typeof deleteTaskSchema>;

/**
 * Фильтры живут в адресной строке:
 *   ?q=отчёт&status=new,in_progress&priority=high&assignee=<id|none>&overdue=1
 * Несколько значений одного фильтра пишутся через запятую в одном параметре;
 * если параметр повторён (?status=new&status=done), учитывается первый.
 * Адрес может прийти любой, поэтому разбор «мягкий»: неверные значения
 * молча отбрасываются, страница не падает.
 */

type SearchParamValue = string | readonly string[] | undefined;
export type TaskSearchParams = Readonly<Record<string, SearchParamValue>>;

function firstValue(value: SearchParamValue): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

function parseList<T extends string>(
  value: SearchParamValue,
  allowed: readonly T[],
): readonly T[] | undefined {
  const raw = firstValue(value);
  if (!raw) {
    return undefined;
  }
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is T => (allowed as readonly string[]).includes(item));
  const unique = [...new Set(items)];
  return unique.length > 0 ? unique : undefined;
}

function parseAssignee(value: SearchParamValue): AssigneeFilter | undefined {
  const raw = firstValue(value);
  if (raw === UNASSIGNED_PARAM) {
    return { kind: "unassigned" };
  }
  return raw && z.uuid().safeParse(raw).success ? { kind: "member", id: raw } : undefined;
}

export function parseTaskFilters(params: TaskSearchParams): TaskFilters {
  const rawSearch = firstValue(params.q);
  const search = rawSearch
    ? stripNulCharacters(rawSearch).trim().slice(0, TASK_SEARCH_MAX_LENGTH)
    : undefined;
  const statuses = parseList(params.status, TASK_STATUSES);
  const priorities = parseList(params.priority, TASK_PRIORITIES);
  const assignee = parseAssignee(params.assignee);
  const overdueOnly = firstValue(params.overdue) === "1";

  return {
    ...(search ? { search } : {}),
    ...(statuses ? { statuses } : {}),
    ...(priorities ? { priorities } : {}),
    ...(assignee ? { assignee } : {}),
    ...(overdueOnly ? { overdueOnly } : {}),
  };
}
