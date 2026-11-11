import "server-only";
import { count, inArray } from "drizzle-orm";
import type { Auth } from "@/features/auth/server/auth";
import { toInternalEmail } from "@/features/auth/server/service";
import type { TaskPriority, TaskStatus } from "@/features/tasks/model";
import { isoDateFromToday } from "@/lib/dates";
import { sessions, tasks, users } from "./schema";
import type { Database } from "./types";

/**
 * Демо-данные для проверяющих: четыре участника и набор задач во всех статусах.
 * Дедлайны считаются от текущей даты, поэтому демо всегда выглядит «живым»:
 * есть и просроченная задача, и задачи на ближайшие дни.
 */

const DEMO_USERS = [
  { username: "anna", name: "Анна Смирнова" },
  { username: "olga", name: "Ольга Кузнецова" },
  { username: "maxim", name: "Максим Романов" },
  { username: "dmitry", name: "Дмитрий Лебедев" },
] as const;

type DemoUsername = (typeof DEMO_USERS)[number]["username"];

type DemoTask = {
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  /** Дедлайн в днях от сегодня; null — без срока. */
  readonly dueInDays: number | null;
  readonly creator: DemoUsername;
  readonly assignee: DemoUsername | null;
};

const DEMO_TASKS: readonly DemoTask[] = [
  {
    title: "Подготовить презентацию для клиента",
    description: "Собрать слайды с результатами квартала и планом работ.",
    status: "new",
    priority: "high",
    dueInDays: 2,
    creator: "anna",
    assignee: "anna",
  },
  {
    title: "Обновить документацию по API",
    description: "Описать новые методы и добавить примеры запросов.",
    status: "new",
    priority: "medium",
    dueInDays: 5,
    creator: "anna",
    assignee: "maxim",
  },
  {
    title: "Собрать отзывы пользователей",
    description: "",
    status: "new",
    priority: "low",
    dueInDays: null,
    creator: "olga",
    assignee: null,
  },
  {
    title: "Исправить баг в фильтрах",
    description: "Фильтр по ответственному сбрасывается после обновления страницы.",
    status: "in_progress",
    priority: "high",
    dueInDays: -3,
    creator: "maxim",
    assignee: "dmitry",
  },
  {
    title: "Дизайн страницы настроек",
    description: "Макеты для компьютера и телефона.",
    status: "in_progress",
    priority: "medium",
    dueInDays: 1,
    creator: "anna",
    assignee: "olga",
  },
  {
    title: "Настроить резервное копирование базы",
    description: "",
    status: "in_progress",
    priority: "medium",
    dueInDays: 7,
    creator: "dmitry",
    assignee: "dmitry",
  },
  {
    title: "Провести планёрку команды",
    description: "Обсудить приоритеты на следующую неделю.",
    status: "done",
    priority: "medium",
    dueInDays: -1,
    creator: "anna",
    assignee: "anna",
  },
  {
    title: "Выбрать библиотеку для графиков",
    description: "",
    status: "done",
    priority: "low",
    dueInDays: null,
    creator: "olga",
    assignee: "maxim",
  },
  {
    title: "Написать тесты для авторизации",
    description: "Покрыть вход, регистрацию и выход.",
    status: "done",
    priority: "high",
    dueInDays: -5,
    creator: "maxim",
    assignee: "maxim",
  },
];

export type SeedOptions = {
  readonly db: Database;
  /**
   * Создаёт авторизацию поверх переданного подключения. Нужна фабрика, а не готовый
   * объект: пользователи создаются внутри транзакции, и авторизация должна писать в неё же.
   */
  readonly authFor: (db: Database) => Auth;
  /** Общий пароль демо-аккаунтов. */
  readonly password: string;
  readonly now?: Date;
};

export type SeedResult = {
  readonly seeded: boolean;
  readonly users: number;
  readonly tasks: number;
};

/**
 * Пользователи создаются через обычную регистрацию библиотеки авторизации —
 * так пароль хэшируется тем же способом, что и у настоящих аккаунтов.
 * Сессии, которые регистрация открывает попутно, сразу удаляются.
 */
async function createDemoUsers(
  db: Database,
  auth: Auth,
  password: string,
): Promise<Map<DemoUsername, string>> {
  const idsByUsername = new Map<DemoUsername, string>();

  for (const demoUser of DEMO_USERS) {
    const { user } = await auth.api.signUpEmail({
      body: {
        email: toInternalEmail(demoUser.username),
        username: demoUser.username,
        name: demoUser.name,
        password,
      },
    });
    idsByUsername.set(demoUser.username, user.id);
  }

  await db.delete(sessions).where(inArray(sessions.userId, [...idsByUsername.values()]));
  return idsByUsername;
}

function requireId(ids: Map<DemoUsername, string>, username: DemoUsername): string {
  const id = ids.get(username);
  if (!id) {
    throw new Error(`Демо-пользователь не создан: ${username}`);
  }
  return id;
}

/**
 * Заполняет базу демо-данными. Если в базе уже есть пользователи — ничего не делает.
 * Всё выполняется одной транзакцией: при любом сбое база остаётся пустой,
 * и следующий запуск повторит попытку целиком (половинчатых данных не бывает).
 */
export async function seedDemoData({
  db,
  authFor,
  password,
  now = new Date(),
}: SeedOptions): Promise<SeedResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ value: count() }).from(users);
    if ((existing?.value ?? 0) > 0) {
      return { seeded: false, users: 0, tasks: 0 };
    }

    const ids = await createDemoUsers(tx, authFor(tx), password);
    const rows = DEMO_TASKS.map((task) => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueInDays === null ? null : isoDateFromToday(task.dueInDays, now),
      creatorId: requireId(ids, task.creator),
      assigneeId: task.assignee === null ? null : requireId(ids, task.assignee),
    }));
    await tx.insert(tasks).values(rows);

    return { seeded: true, users: DEMO_USERS.length, tasks: rows.length };
  });
}
