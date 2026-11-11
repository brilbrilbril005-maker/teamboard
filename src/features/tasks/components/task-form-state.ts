import type { z } from "zod";
import type { IsoDate } from "@/lib/dates";
import type { FieldErrors } from "@/lib/errors";
import {
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../model";
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskData,
  type UpdateTaskData,
} from "../schemas";

/**
 * Состояние формы задачи и его перевод во ввод серверных действий.
 * Чистые функции без React: форма хранит значения, а правила проверки
 * берутся из тех же Zod-схем, что и на сервере.
 */

/** Значение пункта «Не назначен»: выпадающий список не принимает пустую строку. */
export const UNASSIGNED_VALUE = "none";

export type TaskFormValues = {
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  /** id участника или UNASSIGNED_VALUE. */
  readonly assigneeId: string;
  readonly dueDate: IsoDate | null;
};

export type TaskFormField = keyof TaskFormValues;
export type TaskFormErrors = Readonly<Partial<Record<TaskFormField, string>>>;

const FORM_FIELDS: readonly TaskFormField[] = [
  "title",
  "description",
  "status",
  "priority",
  "assigneeId",
  "dueDate",
];

/** С какой доли лимита показывать счётчик символов. */
const COUNTER_THRESHOLD = 0.8;

export function emptyTaskFormValues(status: TaskStatus = DEFAULT_TASK_STATUS): TaskFormValues {
  return {
    title: "",
    description: "",
    status,
    priority: DEFAULT_TASK_PRIORITY,
    assigneeId: UNASSIGNED_VALUE,
    dueDate: null,
  };
}

export function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assignee?.id ?? UNASSIGNED_VALUE,
    dueDate: task.dueDate,
  };
}

function assigneeFromForm(value: string): string | null {
  return value === UNASSIGNED_VALUE ? null : value;
}

function isFormField(value: string): value is TaskFormField {
  return (FORM_FIELDS as readonly string[]).includes(value);
}

/** Ключ поля из пути ошибки: при изменении поля лежат внутри changes («changes.title»). */
function fieldFromPath(path: string): TaskFormField | null {
  const field = path.startsWith("changes.") ? path.slice("changes.".length) : path;
  return isFormField(field) ? field : null;
}

/** Первые сообщения по каждому полю формы. Ошибки без поля отбрасываются. */
export function toTaskFormErrors(entries: readonly (readonly [string, string])[]): TaskFormErrors {
  return entries.reduce<TaskFormErrors>((errors, [path, message]) => {
    const field = fieldFromPath(path);
    return field && !errors[field] ? { ...errors, [field]: message } : errors;
  }, {});
}

function issuesToErrors(error: z.ZodError): TaskFormErrors {
  return toTaskFormErrors(
    error.issues.map((issue) => [issue.path.map(String).join("."), issue.message] as const),
  );
}

/** Ошибки полей из ответа сервера (ActionError.fieldErrors). */
export function serverFieldErrors(fieldErrors: FieldErrors | undefined): TaskFormErrors {
  if (!fieldErrors) {
    return {};
  }
  return toTaskFormErrors(
    Object.entries(fieldErrors).flatMap(([path, messages]) =>
      messages.length > 0 ? [[path, messages[0] ?? ""] as const] : [],
    ),
  );
}

export type ValidationOutcome<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly errors: TaskFormErrors };

export function validateCreateTask(values: TaskFormValues): ValidationOutcome<CreateTaskData> {
  const parsed = createTaskSchema.safeParse({
    ...values,
    assigneeId: assigneeFromForm(values.assigneeId),
  });
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, errors: issuesToErrors(parsed.error) };
}

type TaskChanges = UpdateTaskData["changes"];

/** Только поля, которые пользователь действительно изменил (пробелы по краям не в счёт). */
export function diffTaskChanges(task: Task, values: TaskFormValues): TaskChanges {
  const assigneeId = assigneeFromForm(values.assigneeId);
  return {
    ...(values.title.trim() !== task.title ? { title: values.title } : {}),
    ...(values.description.trim() !== task.description ? { description: values.description } : {}),
    ...(values.status !== task.status ? { status: values.status } : {}),
    ...(values.priority !== task.priority ? { priority: values.priority } : {}),
    ...(assigneeId !== (task.assignee?.id ?? null) ? { assigneeId } : {}),
    ...(values.dueDate !== task.dueDate ? { dueDate: values.dueDate } : {}),
  };
}

/**
 * Проверка изменений перед сохранением. data = null — менять нечего,
 * окно можно просто закрыть без запроса к серверу.
 */
export function validateUpdateTask(
  task: Task,
  values: TaskFormValues,
): ValidationOutcome<UpdateTaskData | null> {
  const changes = diffTaskChanges(task, values);
  if (Object.keys(changes).length === 0) {
    return { ok: true, data: null };
  }
  const parsed = updateTaskSchema.safeParse({ id: task.id, changes });
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, errors: issuesToErrors(parsed.error) };
}

/** Показывать ли счётчик «170 / 200»: только при приближении к лимиту. */
export function shouldShowCounter(length: number, max: number): boolean {
  return length >= Math.floor(max * COUNTER_THRESHOLD);
}
