"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { CurrentUser } from "@/features/auth/model";
import type { TeamMember } from "@/features/users/model";
import type { IsoDate } from "@/lib/dates";
import type { ActionResult } from "@/lib/result";
import { isTaskOverdue, type Task, type TaskStatus } from "../model";
import { canDeleteTask } from "../policy";
import { createTaskAction, updateTaskAction } from "../server/actions";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { useTrackMutation } from "./save-status";
import { runTaskMutation } from "./task-dialog-mutation";
import { TaskFormFields } from "./task-form-fields";
import {
  emptyTaskFormValues,
  serverFieldErrors,
  taskToFormValues,
  validateCreateTask,
  validateUpdateTask,
  type TaskFormErrors,
  type TaskFormField,
  type TaskFormValues,
} from "./task-form-state";

export type TaskFormMode =
  | { readonly kind: "create"; readonly status?: TaskStatus }
  | { readonly kind: "edit"; readonly task: Task; readonly today: IsoDate };

const COPY = {
  create: {
    title: "Новая задача",
    submit: "Создать задачу",
    pending: "Создание…",
    success: "Задача создана",
  },
  edit: {
    title: "Редактирование задачи",
    submit: "Сохранить",
    pending: "Сохранение…",
    success: "Изменения сохранены",
  },
} as const;

type Submission =
  | { readonly kind: "invalid"; readonly errors: TaskFormErrors }
  | { readonly kind: "unchanged" }
  | { readonly kind: "send"; readonly mutate: () => Promise<ActionResult<Task>> };

/** Проверяет форму той же схемой, что и сервер, и готовит нужное действие. */
function prepareSubmission(mode: TaskFormMode, values: TaskFormValues): Submission {
  if (mode.kind === "create") {
    const outcome = validateCreateTask(values);
    return outcome.ok
      ? { kind: "send", mutate: () => createTaskAction(outcome.data) }
      : { kind: "invalid", errors: outcome.errors };
  }
  const outcome = validateUpdateTask(mode.task, values);
  if (!outcome.ok) {
    return { kind: "invalid", errors: outcome.errors };
  }
  const data = outcome.data;
  return data ? { kind: "send", mutate: () => updateTaskAction(data) } : { kind: "unchanged" };
}

function initialValues(mode: TaskFormMode): TaskFormValues {
  return mode.kind === "edit" ? taskToFormValues(mode.task) : emptyTaskFormValues(mode.status);
}

/** Задачу удалили, пока окно было открыто: держать его открытым бессмысленно. */
const CLOSING_ERROR_CODES = new Set(["NOT_FOUND"]);
// Сенсорный экран без мыши — телефон или планшет.
const COARSE_POINTER_QUERY = "(pointer: coarse)";

export type TaskFormDialogProps = {
  readonly mode: TaskFormMode;
  readonly members: readonly TeamMember[];
  readonly currentUser: CurrentUser;
  readonly onClose: () => void;
  /** Куда вернуть фокус после закрытия (кнопка, которой окно открыли). */
  readonly onCloseAutoFocus?: (event: Event) => void;
};

/**
 * Окно «Новая задача» / «Редактирование задачи». На компьютере — по центру,
 * на телефоне — нижняя шторка. Монтируется заново при каждом открытии,
 * поэтому состояние формы всегда начинается с чистого листа.
 */
export function TaskFormDialog({
  mode,
  members,
  currentUser,
  onClose,
  onCloseAutoFocus,
}: TaskFormDialogProps) {
  const copy = COPY[mode.kind];
  const [values, setValues] = useState(() => initialValues(mode));
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [isPending, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const focusErrorRef = useRef(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  // Подтверждение удаления открывается поверх окна: при «Отмена» правки в форме сохраняются.
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);
  const track = useTrackMutation();

  // После неудачной проверки — фокус на первое поле с ошибкой.
  useEffect(() => {
    if (!focusErrorRef.current) {
      return;
    }
    focusErrorRef.current = false;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);

  const changeField = <Field extends TaskFormField>(field: Field, value: TaskFormValues[Field]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const showErrors = (next: TaskFormErrors) => {
    focusErrorRef.current = true;
    setErrors(next);
  };

  const handleFailure = (result: Extract<ActionResult<Task>, { ok: false }>) => {
    const fieldErrors = serverFieldErrors(result.error.fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      showErrors(fieldErrors);
      return;
    }
    toast.error(result.error.message);
    if (CLOSING_ERROR_CODES.has(result.error.code)) {
      onClose();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }
    const submission = prepareSubmission(mode, values);
    if (submission.kind === "invalid") {
      showErrors(submission.errors);
      return;
    }
    if (submission.kind === "unchanged") {
      onClose();
      return;
    }
    submittingRef.current = true;
    startTransition(async () => {
      const result = await runTaskMutation(track, submission.mutate);
      submittingRef.current = false;
      if (result.ok) {
        toast.success(copy.success);
        onClose();
        return;
      }
      handleFailure(result);
    });
  };

  // Пока запрос идёт, окно не закрывается: иначе ответ сервера потеряется.
  const handleOpenChange = (open: boolean) => {
    if (!open && !isPending) {
      onClose();
    }
  };

  const focusTitle = (event: Event) => {
    event.preventDefault();
    // На телефоне при редактировании не открываем клавиатуру сразу: она закрыла бы
    // половину шторки. Фокус — на само окно, чтобы диктор и клавиатура оставались внутри.
    if (mode.kind === "edit" && window.matchMedia(COARSE_POINTER_QUERY).matches) {
      (event.currentTarget as HTMLElement | null)?.focus();
      return;
    }
    const input = titleRef.current;
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  };

  // После «Отмена» в подтверждении — обратно на «Удалить задачу». Если окно закрылось
  // целиком (задача удалена), кнопки уже нет — фокус вернёт внешнее окно.
  const focusDeleteButton = (event: Event) => {
    event.preventDefault();
    const button = deleteButtonRef.current;
    if (button?.isConnected) {
      button.focus();
    }
  };

  const editedTask = mode.kind === "edit" ? mode.task : null;
  const isOverdue = mode.kind === "edit" && isTaskOverdue(values, mode.today);
  const canDelete = editedTask !== null && canDeleteTask(currentUser, editedTask);

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        title={copy.title}
        size="lg"
        onOpenAutoFocus={focusTitle}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={isPending || undefined}>
          <TaskFormFields
            values={values}
            errors={errors}
            onChange={changeField}
            members={members}
            isOverdue={isOverdue}
            titleRef={titleRef}
          />
          <DialogFooter>
            <Button type="submit" loading={isPending} loadingText={copy.pending}>
              {copy.submit}
            </Button>
            <DialogClose asChild>
              <Button variant="secondary" disabled={isPending}>
                Отмена
              </Button>
            </DialogClose>
          </DialogFooter>
          {editedTask && canDelete ? (
            <div className="mt-3 flex justify-center sm:justify-start">
              <Button
                ref={deleteButtonRef}
                variant="danger-ghost"
                icon={<Trash2 aria-hidden="true" />}
                disabled={isPending}
                onClick={() => setConfirmingDelete(true)}
                className="sm:-ml-4"
              >
                Удалить задачу
              </Button>
            </div>
          ) : null}
        </form>
      </DialogContent>
      {editedTask && isConfirmingDelete ? (
        <DeleteTaskDialog
          task={editedTask}
          onClose={() => setConfirmingDelete(false)}
          onDeleted={onClose}
          onCloseAutoFocus={focusDeleteButton}
        />
      ) : null}
    </Dialog>
  );
}
