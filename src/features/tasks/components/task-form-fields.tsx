"use client";

import { UserRound } from "lucide-react";
import type { Ref } from "react";
import { Avatar } from "@/components/ui/avatar";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UNASSIGNED_LABEL } from "@/features/users/components/member-avatar";
import type { TeamMember } from "@/features/users/model";
import { shortName } from "@/lib/names";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_TITLE_MAX_LENGTH,
  type TaskPriority,
  type TaskStatus,
} from "../model";
import { PriorityDot, StatusIcon } from "./badges";
import {
  shouldShowCounter,
  UNASSIGNED_VALUE,
  type TaskFormErrors,
  type TaskFormField,
  type TaskFormValues,
} from "./task-form-state";

const STATUS_OPTIONS: readonly SelectOption<TaskStatus>[] = TASK_STATUSES.map((status) => ({
  value: status,
  label: TASK_STATUS_LABELS[status],
  icon: <StatusIcon status={status} />,
}));

// В списке сверху — самый важный приоритет.
const PRIORITY_OPTIONS: readonly SelectOption<TaskPriority>[] = [...TASK_PRIORITIES]
  .reverse()
  .map((priority) => ({
    value: priority,
    label: TASK_PRIORITY_LABELS[priority],
    icon: <PriorityDot priority={priority} />,
  }));

function assigneeOptions(members: readonly TeamMember[]): readonly SelectOption[] {
  return [
    {
      value: UNASSIGNED_VALUE,
      label: UNASSIGNED_LABEL,
      icon: <UserRound aria-hidden="true" className="text-muted" />,
    },
    ...members.map((member) => ({
      value: member.id,
      // Короткое имя «Анна С.», как на карточках: полное не помещается в половину окна.
      label: shortName(member.name),
      icon: <Avatar name={member.name} colorKey={member.id} size="xs" />,
    })),
  ];
}

/** Счётчик «170 / 200» появляется, только когда текст подбирается к лимиту. */
function counterHint(length: number, max: number): string | undefined {
  return shouldShowCounter(length, max) ? `${length} / ${max}` : undefined;
}

export type TaskFormFieldsProps = {
  readonly values: TaskFormValues;
  readonly errors: TaskFormErrors;
  readonly onChange: <Field extends TaskFormField>(
    field: Field,
    value: TaskFormValues[Field],
  ) => void;
  /** Участники команды для выбора ответственного (уже включая текущего). */
  readonly members: readonly TeamMember[];
  /** Показать «Просрочено» под дедлайном (только в окне редактирования). */
  readonly isOverdue?: boolean;
  readonly titleRef?: Ref<HTMLInputElement>;
};

/** Поля окна задачи: все управляемые — React не сбросит их после отправки. */
export function TaskFormFields({
  values,
  errors,
  onChange,
  members,
  isOverdue = false,
  titleRef,
}: TaskFormFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Название"
        error={errors.title}
        hint={counterHint(values.title.length, TASK_TITLE_MAX_LENGTH)}
      >
        <Input
          ref={titleRef}
          name="title"
          value={values.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Название задачи"
          maxLength={TASK_TITLE_MAX_LENGTH}
          autoComplete="off"
          enterKeyHint="done"
        />
      </Field>

      <Field
        label="Описание"
        error={errors.description}
        hint={counterHint(values.description.length, TASK_DESCRIPTION_MAX_LENGTH)}
      >
        <Textarea
          name="description"
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Добавьте описание задачи"
          maxLength={TASK_DESCRIPTION_MAX_LENGTH}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Статус" error={errors.status}>
          <Select
            options={STATUS_OPTIONS}
            value={values.status}
            onValueChange={(status) => onChange("status", status)}
          />
        </Field>

        <Field label="Ответственный" error={errors.assigneeId}>
          <Select
            options={assigneeOptions(members)}
            value={values.assigneeId}
            onValueChange={(assigneeId) => onChange("assigneeId", assigneeId)}
          />
        </Field>

        <Field label="Приоритет" error={errors.priority}>
          <Select
            options={PRIORITY_OPTIONS}
            value={values.priority}
            onValueChange={(priority) => onChange("priority", priority)}
          />
        </Field>

        <Field
          label="Дедлайн"
          error={errors.dueDate}
          hint={isOverdue ? <span className="text-danger-text">Просрочено</span> : undefined}
        >
          <DatePicker
            value={values.dueDate}
            onValueChange={(dueDate) => onChange("dueDate", dueDate)}
          />
        </Field>
      </div>
    </div>
  );
}
