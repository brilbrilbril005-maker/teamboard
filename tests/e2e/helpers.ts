import { randomUUID } from "node:crypto";
import type { Locator, Page } from "@playwright/test";
import { formatFullDate, formatShortDate, isoDateFromToday, type IsoDate } from "@/lib/dates";
import { expect, uniqueUsername } from "./fixtures";

/**
 * Общие шаги сквозных тестов. Элементы ищем по роли: Next.js держит прежние страницы
 * в документе скрытыми, а поиск по роли видит только то, что видит пользователь.
 * Обе раскладки (компьютер и телефон) есть в разметке, но видна одна — поэтому
 * одни и те же локаторы работают в обоих проектах Playwright.
 */

export const PASSWORD = "e2e-password-123";

export type TestUser = { readonly username: string; readonly name: string };

/** Уникальная метка для названий задач: по ней тест находит только свои задачи. */
export function uniqueToken(): string {
  return `e2e${randomUUID().replaceAll("-", "").slice(0, 10)}`;
}

/**
 * Регистрирует нового пользователя и открывает приложение. Имя из одного слова
 * и уникальное: в выпадающем списке ответственного оно не совпадёт с чужим.
 */
export async function registerUser(page: Page): Promise<TestUser> {
  const username = uniqueUsername("tester");
  const name = `Тестер-${username.slice(-6)}`;

  await page.goto("/register");
  await page.getByRole("textbox", { name: "Логин" }).fill(username);
  await page.getByRole("textbox", { name: "Имя" }).fill(name);
  await page.getByLabel("Пароль", { exact: true }).filter({ visible: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Создать аккаунт" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(userMenuButton(page, name)).toBeVisible();
  return { username, name };
}

export function userMenuButton(page: Page, name: string): Locator {
  return page.getByRole("button", { name: `Меню пользователя ${name}` });
}

export async function signOut(page: Page, name: string): Promise<void> {
  await userMenuButton(page, name).click();
  await page.getByRole("menuitem", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Уведомления (sonner) — свой контейнер с подписью «Уведомления». */
export function toasts(page: Page): Locator {
  return page.getByRole("region", { name: /^Уведомления/ });
}

/** Есть уведомление с этим текстом (предыдущие такие же могут ещё не исчезнуть). */
export async function expectToast(page: Page, text: string): Promise<void> {
  await expect(toasts(page).getByText(text, { exact: true }).first()).toBeVisible();
}

/** Дедлайн через days дней от сегодня (в часовом поясе команды) и как его показывают. */
export function dueDateFromToday(days: number): {
  readonly iso: IsoDate;
  readonly short: string;
  readonly full: string;
} {
  const iso = isoDateFromToday(days);
  return { iso, short: formatShortDate(iso), full: formatFullDate(iso) };
}

export type TaskFields = {
  readonly title?: string;
  readonly description?: string;
  readonly status?: string;
  readonly assignee?: string;
  readonly priority?: string;
  /** Дедлайн в днях от сегодня; отрицательное число — в прошлом. */
  readonly dueInDays?: number;
};

/** Выбор пункта в выпадающем списке (Radix Select: список открывается поверх окна). */
export async function chooseOption(
  page: Page,
  scope: Locator,
  field: string,
  option: string,
): Promise<void> {
  await scope.getByRole("combobox", { name: field }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(scope.getByRole("combobox", { name: field })).toContainText(option);
}

/**
 * Дедлайн выбирается с клавиатуры в календаре: фокус стоит на выбранном дне или на сегодня,
 * стрелки сдвигают день, Enter выбирает. Так не нужно искать кнопку дня по подписи.
 */
async function pickDueDate(page: Page, dialog: Locator, days: number): Promise<void> {
  const trigger = dialog.getByRole("button", { name: "Дедлайн" });
  // Сначала убираем прежнюю дату: тогда календарь откроется на сегодняшнем дне.
  const clear = dialog.getByRole("button", { name: "Убрать дату" });
  if (await clear.isVisible()) {
    await clear.click();
  }
  await trigger.click();
  const calendar = page.getByRole("grid");
  await expect(calendar).toBeVisible();
  const key = days < 0 ? "ArrowLeft" : "ArrowRight";
  for (let step = 0; step < Math.abs(days); step += 1) {
    await page.keyboard.press(key);
  }
  await page.keyboard.press("Enter");
  await expect(calendar).toBeHidden();
  await expect(trigger).toHaveText(dueDateFromToday(days).full);
}

/** Заполняет поля открытого окна задачи; незаданные поля не трогает. */
export async function fillTaskForm(page: Page, dialog: Locator, fields: TaskFields): Promise<void> {
  if (fields.title !== undefined) {
    await dialog.getByRole("textbox", { name: "Название" }).fill(fields.title);
  }
  if (fields.description !== undefined) {
    await dialog.getByRole("textbox", { name: "Описание" }).fill(fields.description);
  }
  if (fields.status) {
    await chooseOption(page, dialog, "Статус", fields.status);
  }
  if (fields.assignee) {
    await chooseOption(page, dialog, "Ответственный", fields.assignee);
  }
  if (fields.priority) {
    await chooseOption(page, dialog, "Приоритет", fields.priority);
  }
  if (fields.dueInDays !== undefined) {
    await pickDueDate(page, dialog, fields.dueInDays);
  }
}

export function taskDialog(page: Page, title: "Новая задача" | "Редактирование задачи"): Locator {
  return page.getByRole("dialog", { name: title });
}

/** Создаёт задачу через «Создать задачу» (на телефоне — круглая кнопка «+»). */
export async function createTask(
  page: Page,
  fields: TaskFields & { readonly title: string },
): Promise<void> {
  await page.getByRole("button", { name: "Создать задачу", exact: true }).click();
  const dialog = taskDialog(page, "Новая задача");
  await expect(dialog).toBeVisible();
  await fillTaskForm(page, dialog, fields);
  await dialog.getByRole("button", { name: "Создать задачу" }).click();
  await expect(dialog).toBeHidden();
  await expectToast(page, "Задача создана");
}

/** Колонка доски (компьютер) по названию статуса. */
export function boardColumn(page: Page, status: string): Locator {
  return page.getByRole("region", { name: status, exact: true });
}

/** Карточка задачи по точному названию — в любом месте видимой страницы. */
export function taskCard(scope: Page | Locator, title: string): Locator {
  // Внутренний локатор для `has` строится от страницы: он ищется внутри каждой карточки.
  const page = "goto" in scope ? scope : scope.page();
  return scope
    .getByRole("article")
    .filter({ has: page.getByRole("button", { name: title, exact: true }) });
}

/** Вкладка статуса на телефоне: «Новая 3». */
export function statusTab(page: Page, status: string): Locator {
  return page.getByRole("tab", { name: new RegExp(`^${status}`) });
}

/**
 * Карточка задачи в нужном статусе: на компьютере — в колонке доски,
 * на телефоне — на вкладке статуса (вкладку открываем).
 */
export async function taskCardInStatus(
  page: Page,
  isMobile: boolean,
  title: string,
  status: string,
): Promise<Locator> {
  if (isMobile) {
    await statusTab(page, status).click();
    return taskCard(page.getByRole("tabpanel"), title);
  }
  return taskCard(boardColumn(page, status), title);
}

export function taskMenuButton(scope: Page | Locator, title: string): Locator {
  return scope.getByRole("button", { name: `Действия с задачей «${title}»` });
}

/**
 * Смена статуса из меню «⋯»: на компьютере — подменю «Изменить статус»,
 * на телефоне статусы прямо в меню.
 */
export async function changeStatusFromMenu(
  page: Page,
  isMobile: boolean,
  card: Locator,
  title: string,
  status: string,
): Promise<void> {
  await taskMenuButton(card, title).click();
  if (!isMobile) {
    await page.getByRole("menuitem", { name: "Изменить статус" }).click();
  }
  await page.getByRole("menuitemradio", { name: status }).click();
  await expectToast(page, `Статус изменён на «${status}».`);
}

/** Строка поиска: на телефоне она открывается кнопкой «Поиск задач». */
export async function searchTasks(page: Page, isMobile: boolean, query: string): Promise<void> {
  const field = page.getByRole("searchbox", { name: "Поиск задач" });
  if (isMobile && !(await field.isVisible())) {
    await page.getByRole("button", { name: "Поиск задач" }).click();
  }
  await field.fill(query);
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === query);
}

/** Нет горизонтальной прокрутки страницы. */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}
