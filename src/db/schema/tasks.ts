import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
} from "@/features/tasks/model";
import { users } from "./auth";

export const taskStatus = pgEnum("task_status", TASK_STATUSES);
export const taskPriority = pgEnum("task_priority", TASK_PRIORITIES);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: TASK_TITLE_MAX_LENGTH }).notNull(),
    description: text("description").notNull().default(""),
    status: taskStatus("status").notNull().default(DEFAULT_TASK_STATUS),
    priority: taskPriority("priority").notNull().default(DEFAULT_TASK_PRIORITY),
    /** Дедлайн — дата без времени, чтобы не зависеть от часовых поясов. */
    dueDate: date("due_date", { mode: "string" }),
    /** Ответственный. Если пользователя удалили, задача остаётся без ответственного. */
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    /** Автор. Пользователя с задачами удалить нельзя — данные не теряются молча. */
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Индексы под фильтры доски и списка.
    index("tasks_status_idx").on(table.status),
    index("tasks_assignee_id_idx").on(table.assigneeId),
    index("tasks_creator_id_idx").on(table.creatorId),
    index("tasks_due_date_idx").on(table.dueDate),
    // Последний рубеж защиты: даже в обход приложения пустую задачу не записать.
    check("tasks_title_not_blank", sql`char_length(btrim(${table.title})) > 0`),
    check(
      "tasks_description_length",
      sql`char_length(${table.description}) <= ${sql.raw(String(TASK_DESCRIPTION_MAX_LENGTH))}`,
    ),
  ],
);
