import "server-only";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { tasks, users } from "@/db/schema";
import type { Database } from "@/db/types";
import type { TeamMember } from "@/features/users/model";
import type { IsoDate } from "@/lib/dates";
import { TASK_LIST_LIMIT, type AssigneeFilter, type Task, type TaskFilters } from "../model";
import type { CreateTaskData, TaskChanges } from "../schemas";

/** Что нужно, чтобы записать новую задачу: проверенные данные формы и автор. */
export type NewTaskRecord = CreateTaskData & { readonly creatorId: string };

/** Ответственный и автор — обе ссылки на users, поэтому таблице нужны два псевдонима. */
const assignee = alias(users, "assignee");
const creator = alias(users, "creator");

const taskColumns = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
  status: tasks.status,
  priority: tasks.priority,
  dueDate: tasks.dueDate,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  assigneeId: assignee.id,
  assigneeName: assignee.name,
  assigneeUsername: assignee.username,
  creatorId: creator.id,
  creatorName: creator.name,
  creatorUsername: creator.username,
};

type TaskRow = {
  id: string;
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeUsername: string | null;
  creatorId: string;
  creatorName: string;
  creatorUsername: string | null;
};

function toMember(id: string, name: string, username: string | null): TeamMember {
  return { id, name, username: username ?? "" };
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    assignee:
      row.assigneeId === null
        ? null
        : toMember(row.assigneeId, row.assigneeName ?? "", row.assigneeUsername),
    creator: toMember(row.creatorId, row.creatorName, row.creatorUsername),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Символы % _ и \ в поиске — обычные буквы, а не шаблон LIKE. */
function toContainsPattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function assigneeCondition(filter: AssigneeFilter): SQL {
  return filter.kind === "unassigned" ? isNull(tasks.assigneeId) : eq(tasks.assigneeId, filter.id);
}

function listConditions(filters: TaskFilters, today: IsoDate): SQL | undefined {
  const conditions: (SQL | undefined)[] = [
    filters.search
      ? or(
          ilike(tasks.title, toContainsPattern(filters.search)),
          ilike(tasks.description, toContainsPattern(filters.search)),
        )
      : undefined,
    filters.statuses?.length ? inArray(tasks.status, [...filters.statuses]) : undefined,
    filters.priorities?.length ? inArray(tasks.priority, [...filters.priorities]) : undefined,
    filters.assignee ? assigneeCondition(filters.assignee) : undefined,
    // Просрочена: дедлайн раньше сегодняшнего дня и задача не завершена (как isTaskOverdue).
    filters.overdueOnly ? and(lt(tasks.dueDate, today), ne(tasks.status, "done")) : undefined,
  ];
  return and(...conditions);
}

/** Сначала высокий приоритет. Порядок задан явно, а не порядком значений в перечислении. */
const PRIORITY_RANK = sql`case ${tasks.priority} when 'high' then 0 when 'medium' then 1 else 2 end`;

const LIST_ORDER = [
  PRIORITY_RANK,
  sql`${tasks.dueDate} asc nulls last`,
  desc(tasks.createdAt),
  desc(tasks.id),
] as const;

export function createTaskRepository(db: Database) {
  const selectTasks = () =>
    db
      .select(taskColumns)
      .from(tasks)
      .innerJoin(creator, eq(tasks.creatorId, creator.id))
      .leftJoin(assignee, eq(tasks.assigneeId, assignee.id));

  async function findById(id: string): Promise<Task | null> {
    const [row] = await selectTasks().where(eq(tasks.id, id)).limit(1);
    return row ? toTask(row) : null;
  }

  return {
    findById,

    /** Задачи доски с автором и ответственным — одним запросом. */
    async list(filters: TaskFilters, today: IsoDate): Promise<Task[]> {
      const rows = await selectTasks()
        .where(listConditions(filters, today))
        .orderBy(...LIST_ORDER)
        .limit(TASK_LIST_LIMIT);
      return rows.map(toTask);
    },

    async create(record: NewTaskRecord): Promise<Task> {
      const [inserted] = await db.insert(tasks).values(record).returning({ id: tasks.id });
      const task = inserted ? await findById(inserted.id) : null;
      if (!task) {
        throw new Error("Созданная задача не найдена");
      }
      return task;
    },

    /** Меняет только переданные поля. null — если задачи уже нет. */
    async update(id: string, changes: TaskChanges): Promise<Task | null> {
      const [updated] = await db
        .update(tasks)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning({ id: tasks.id });
      return updated ? findById(updated.id) : null;
    },

    /** true — задача была и удалена; false — её уже не было. */
    async delete(id: string): Promise<boolean> {
      const deleted = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
      return deleted.length > 0;
    },

    async countAll(): Promise<number> {
      const [row] = await db.select({ value: count() }).from(tasks);
      return row?.value ?? 0;
    },

    /** Сколько задач у каждого участника (для панели «Команда»): id участника → число. */
    async countByAssignee(): Promise<Record<string, number>> {
      const rows = await db
        .select({ assigneeId: tasks.assigneeId, value: count() })
        .from(tasks)
        .where(isNotNull(tasks.assigneeId))
        .groupBy(tasks.assigneeId);
      return Object.fromEntries(
        rows.flatMap((row) => (row.assigneeId ? [[row.assigneeId, row.value]] : [])),
      );
    },
  };
}

export type TaskRepository = ReturnType<typeof createTaskRepository>;
