import { describe, expect, test } from "vitest";
import { TASK_TITLE_MAX_LENGTH, type Task } from "../model";
import {
  diffTaskChanges,
  emptyTaskFormValues,
  serverFieldErrors,
  shouldShowCounter,
  taskToFormValues,
  toTaskFormErrors,
  UNASSIGNED_VALUE,
  validateCreateTask,
  validateUpdateTask,
  type TaskFormValues,
} from "./task-form-state";

const ANNA = {
  id: "11111111-1111-4111-8111-111111111111",
  username: "anna",
  name: "Анна Смирнова",
};
const OLGA = {
  id: "22222222-2222-4222-8222-222222222222",
  username: "olga",
  name: "Ольга Кузнецова",
};

const TASK: Task = {
  id: "33333333-3333-4333-8333-333333333333",
  title: "Исправить баг в фильтрах",
  description: "Проверить фильтрацию по статусу",
  status: "in_progress",
  priority: "high",
  dueDate: "2026-11-08",
  assignee: ANNA,
  creator: ANNA,
  createdAt: new Date("2026-11-01T10:00:00Z"),
  updatedAt: new Date("2026-11-01T10:00:00Z"),
};

const withValues = (changes: Partial<TaskFormValues>): TaskFormValues => ({
  ...taskToFormValues(TASK),
  ...changes,
});

describe("начальные значения формы", () => {
  test("новая задача: пустая, средний приоритет, без ответственного и даты", () => {
    expect(emptyTaskFormValues()).toEqual({
      title: "",
      description: "",
      status: "new",
      priority: "medium",
      assigneeId: UNASSIGNED_VALUE,
      dueDate: null,
    });
  });

  test("новая задача берёт статус колонки, из которой её создают", () => {
    expect(emptyTaskFormValues("done").status).toBe("done");
  });

  test("редактирование: значения задачи, без ответственного — «Не назначен»", () => {
    expect(taskToFormValues(TASK).assigneeId).toBe(ANNA.id);
    expect(taskToFormValues({ ...TASK, assignee: null }).assigneeId).toBe(UNASSIGNED_VALUE);
  });
});

describe("validateCreateTask", () => {
  test("пустое название — ошибка под полем «Название»", () => {
    const outcome = validateCreateTask(emptyTaskFormValues());

    expect(outcome).toEqual({ ok: false, errors: { title: "Введите название задачи" } });
  });

  test("название из одних пробелов тоже считается пустым", () => {
    const outcome = validateCreateTask({ ...emptyTaskFormValues(), title: "   " });

    expect(outcome.ok).toBe(false);
  });

  test("верные значения: обрезает пробелы, «Не назначен» превращает в null", () => {
    const outcome = validateCreateTask({
      ...emptyTaskFormValues(),
      title: "  Подготовить отчёт  ",
      description: " Для клиента ",
      dueDate: "2026-11-20",
    });

    expect(outcome).toEqual({
      ok: true,
      data: {
        title: "Подготовить отчёт",
        description: "Для клиента",
        status: "new",
        priority: "medium",
        dueDate: "2026-11-20",
        assigneeId: null,
      },
    });
  });

  test("слишком длинное название не проходит", () => {
    const outcome = validateCreateTask({
      ...emptyTaskFormValues(),
      title: "а".repeat(TASK_TITLE_MAX_LENGTH + 1),
    });

    expect(outcome.ok).toBe(false);
    expect(outcome.ok ? null : outcome.errors.title).toContain(String(TASK_TITLE_MAX_LENGTH));
  });
});

describe("diffTaskChanges", () => {
  test("без правок изменений нет", () => {
    expect(diffTaskChanges(TASK, taskToFormValues(TASK))).toEqual({});
  });

  test("пробелы по краям названия и описания изменением не считаются", () => {
    const values = withValues({ title: ` ${TASK.title} `, description: `${TASK.description}\n` });

    expect(diffTaskChanges(TASK, values)).toEqual({});
  });

  test("попадают только изменённые поля", () => {
    const values = withValues({ status: "done", assigneeId: OLGA.id, dueDate: null });

    expect(diffTaskChanges(TASK, values)).toEqual({
      status: "done",
      assigneeId: OLGA.id,
      dueDate: null,
    });
  });

  test("снять ответственного — передать null", () => {
    expect(diffTaskChanges(TASK, withValues({ assigneeId: UNASSIGNED_VALUE }))).toEqual({
      assigneeId: null,
    });
  });

  test("назначить ответственного задаче без него", () => {
    const task = { ...TASK, assignee: null };
    expect(diffTaskChanges(task, { ...taskToFormValues(task), assigneeId: OLGA.id })).toEqual({
      assigneeId: OLGA.id,
    });
  });

  test("смена названия, описания и приоритета", () => {
    const values = withValues({ title: "Новое", description: "", priority: "low" });

    expect(diffTaskChanges(TASK, values)).toEqual({
      title: "Новое",
      description: "",
      priority: "low",
    });
  });
});

describe("validateUpdateTask", () => {
  test("ничего не изменили — сохранять нечего (data = null)", () => {
    expect(validateUpdateTask(TASK, taskToFormValues(TASK))).toEqual({ ok: true, data: null });
  });

  test("отправляет id и только изменённые поля, уже обрезанные", () => {
    const outcome = validateUpdateTask(TASK, withValues({ title: "  Новое название " }));

    expect(outcome).toEqual({
      ok: true,
      data: { id: TASK.id, changes: { title: "Новое название" } },
    });
  });

  test("стёртое название — ошибка у поля «Название» (без префикса changes.)", () => {
    const outcome = validateUpdateTask(TASK, withValues({ title: "  " }));

    expect(outcome).toEqual({ ok: false, errors: { title: "Введите название задачи" } });
  });
});

describe("ошибки полей", () => {
  test("ошибки сервера: берётся первое сообщение, префикс changes. убирается", () => {
    const errors = serverFieldErrors({
      "changes.assigneeId": ["Участник не найден", "ещё"],
      title: ["Слишком длинно"],
    });

    expect(errors).toEqual({ assigneeId: "Участник не найден", title: "Слишком длинно" });
  });

  test("неизвестные поля и пустые списки отбрасываются", () => {
    expect(serverFieldErrors({ id: ["Некорректный id"], status: [] })).toEqual({});
    expect(serverFieldErrors(undefined)).toEqual({});
  });

  test("для поля остаётся первое сообщение", () => {
    expect(
      toTaskFormErrors([
        ["title", "первое"],
        ["changes.title", "второе"],
      ]),
    ).toEqual({ title: "первое" });
  });
});

describe("shouldShowCounter", () => {
  test("счётчик появляется с 80 % лимита", () => {
    expect(shouldShowCounter(159, 200)).toBe(false);
    expect(shouldShowCounter(160, 200)).toBe(true);
    expect(shouldShowCounter(200, 200)).toBe(true);
  });
});
