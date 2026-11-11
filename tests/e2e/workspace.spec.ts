import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  createTask,
  expectNoHorizontalScroll,
  registerUser,
  searchTasks,
  statusTab,
  uniqueToken,
  userMenuButton,
  type TestUser,
} from "./helpers";

/**
 * Поиск, фильтры, «Мои задачи», вид «Доска/Список», тема и вёрстка на телефоне.
 * Проверяем только свои задачи с уникальной меткой: параллельные тесты создают свои.
 */

type TokenTasks = { readonly alpha: string; readonly beta: string; readonly gamma: string };

/**
 * Три задачи с общей меткой:
 * альфа — высокий приоритет, «Новая», на мне, просрочена;
 * бета — низкий, «В работе», без ответственного;
 * гамма — средний, «Завершена», на Ольге.
 */
async function createTokenTasks(page: Page, user: TestUser, token: string): Promise<TokenTasks> {
  const tasks = {
    alpha: `${token} альфа`,
    beta: `${token} бета`,
    gamma: `${token} гамма`,
  };
  await createTask(page, {
    title: tasks.alpha,
    priority: "Высокий",
    assignee: user.name,
    dueInDays: -1,
  });
  await createTask(page, { title: tasks.beta, priority: "Низкий", status: "В работе" });
  await createTask(page, {
    title: tasks.gamma,
    priority: "Средний",
    status: "Завершена",
    assignee: "Ольга К.",
  });
  return tasks;
}

const titleButton = (page: Page, title: string) =>
  page.getByRole("button", { name: title, exact: true });

/** Видны ровно эти задачи из набора (остальные из набора — нет). */
async function expectOnly(page: Page, tasks: TokenTasks, visible: readonly string[]) {
  for (const title of Object.values(tasks)) {
    if (visible.includes(title)) {
      await expect(titleButton(page, title)).toBeVisible();
    } else {
      await expect(titleButton(page, title)).toHaveCount(0);
    }
  }
}

const param = (name: string) => (url: URL) => url.searchParams.get(name);

async function toggleMenuItem(page: Page, menu: string, item: string) {
  await page.getByRole("button", { name: new RegExp(`^${menu}`) }).click();
  await page.getByRole("menuitemcheckbox", { name: item }).click();
  // Меню статуса и приоритета не закрывается после выбора — закрываем сами.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
}

test.describe("поиск и фильтры на компьютере", () => {
  test.skip(({ isMobile }) => isMobile, "Панель фильтров — только на широком экране");

  test("фильтры попадают в адрес, переживают перезагрузку и сбрасываются", async ({ page }) => {
    const user = await registerUser(page);
    const token = uniqueToken();
    const tasks = await createTokenTasks(page, user, token);

    await searchTasks(page, false, token);
    await expectOnly(page, tasks, [tasks.alpha, tasks.beta, tasks.gamma]);

    // Статус.
    await toggleMenuItem(page, "Статус", "В работе");
    await expect(page).toHaveURL((url) => param("status")(url) === "in_progress");
    await expectOnly(page, tasks, [tasks.beta]);

    await page.reload();
    await expectOnly(page, tasks, [tasks.beta]);
    await expect(page.getByRole("searchbox", { name: "Поиск задач" })).toHaveValue(token);
    await expect(page.getByRole("button", { name: "Статус: выбрано 1" })).toBeVisible();

    // Приоритет вместо статуса.
    await toggleMenuItem(page, "Статус", "В работе");
    await toggleMenuItem(page, "Приоритет", "Высокий");
    await expect(page).toHaveURL(
      (url) => param("priority")(url) === "high" && param("status")(url) === null,
    );
    await expectOnly(page, tasks, [tasks.alpha]);

    // Только просроченные.
    await toggleMenuItem(page, "Приоритет", "Высокий");
    await page.getByRole("button", { name: "Просроченные" }).click();
    await expect(page).toHaveURL(
      (url) => param("overdue")(url) === "1" && param("priority")(url) === null,
    );
    await expectOnly(page, tasks, [tasks.alpha]);

    // Ответственный.
    await page.getByRole("button", { name: "Просроченные" }).click();
    await page.getByRole("button", { name: /^Ответственный/ }).click();
    await page.getByRole("menuitemcheckbox", { name: "Ольга Кузнецова" }).click();
    await expect(page).toHaveURL(
      (url) => Boolean(param("assignee")(url)) && !param("overdue")(url),
    );
    await expectOnly(page, tasks, [tasks.gamma]);

    await page.reload();
    await expectOnly(page, tasks, [tasks.gamma]);

    // «Сбросить фильтры» снимает всё, включая поиск.
    await page.getByRole("button", { name: "Сбросить фильтры" }).click();
    await expect(page).toHaveURL((url) => url.search === "");
    await expect(page.getByRole("searchbox", { name: "Поиск задач" })).toHaveValue("");
    await expectOnly(page, tasks, [tasks.alpha, tasks.beta, tasks.gamma]);
  });

  test("пустой результат поиска и сброс из него", async ({ page }) => {
    await registerUser(page);

    await searchTasks(page, false, uniqueToken());
    const main = page.getByRole("main");
    await expect(main.getByText("По вашему запросу ничего не найдено")).toBeVisible();

    await main.getByRole("button", { name: "Сбросить фильтры" }).click();
    await expect(page).toHaveURL((url) => url.search === "");
    await expect(page.getByRole("region", { name: "Новая", exact: true })).toBeVisible();
  });

  test("«Мои задачи» показывают задачи текущего пользователя", async ({ page }) => {
    const user = await registerUser(page);
    const token = uniqueToken();
    const mine = `${token} моя`;
    const other = `${token} ничья`;
    await createTask(page, { title: mine, assignee: user.name });
    await createTask(page, { title: other });

    const myTasks = page.getByRole("button", { name: "Мои задачи" });
    await myTasks.click();
    await expect(page).toHaveURL((url) => Boolean(param("assignee")(url)));
    await expect(titleButton(page, mine)).toBeVisible();
    await expect(titleButton(page, other)).toHaveCount(0);

    await page.reload();
    await expect(myTasks).toHaveAttribute("aria-pressed", "true");
    await expect(titleButton(page, mine)).toBeVisible();
    await expect(titleButton(page, other)).toHaveCount(0);
    // В панели «Команда» у текущего пользователя одна задача.
    await expect(
      page.getByRole("button", { name: new RegExp(`^${user.name}.*1 задача`) }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Все задачи" }).click();
    await expect(page).toHaveURL((url) => param("assignee")(url) === null);
    await expect(titleButton(page, other)).toBeVisible();
  });

  test("вид «Доска / Список» сохраняется в адресе", async ({ page }) => {
    await registerUser(page);

    await page.getByRole("radio", { name: "Список" }).click();
    await expect(page).toHaveURL((url) => param("view")(url) === "list");
    await expect(page.getByRole("table")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Список" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.getByRole("radio", { name: "Доска" }).click();
    await expect(page).toHaveURL((url) => param("view")(url) === null);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Новая", exact: true })).toBeVisible();
  });
});

test.describe("поиск и фильтры на телефоне", () => {
  test.skip(({ isMobile }) => !isMobile, "Шторка фильтров и поиск — мобильная раскладка");

  test("шторка фильтров: выбор попадает в адрес и сбрасывается", async ({ page }) => {
    const user = await registerUser(page);
    const tasks = await createTokenTasks(page, user, uniqueToken());

    await page.getByRole("button", { name: "Фильтры", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Фильтры" });
    await sheet.getByRole("button", { name: "Высокий" }).click();
    await sheet.getByRole("switch", { name: "Только просроченные" }).click();
    await expect(page).toHaveURL(
      (url) => param("priority")(url) === "high" && param("overdue")(url) === "1",
    );
    await sheet.getByRole("button", { name: /^Показать \d+ задач/ }).click();
    await expect(sheet).toBeHidden();

    await statusTab(page, "Новая").click();
    await expect(titleButton(page, tasks.alpha)).toBeVisible();
    await statusTab(page, "В работе").click();
    await expect(titleButton(page, tasks.beta)).toHaveCount(0);

    await page.reload();
    const filtersButton = page.getByRole("button", { name: "Фильтры: включено 2" });
    await expect(filtersButton).toBeVisible();
    await filtersButton.click();
    await sheet.getByRole("button", { name: "Сбросить" }).click();
    await expect(page).toHaveURL((url) => url.search === "");
  });

  test("поиск показывает найденные задачи и переживает перезагрузку", async ({ page }) => {
    const user = await registerUser(page);
    const token = uniqueToken();
    const tasks = await createTokenTasks(page, user, token);

    await searchTasks(page, true, token);
    await expect(page.getByText("Найдено 3 задачи", { exact: true })).toBeVisible();
    await expectOnly(page, tasks, [tasks.alpha, tasks.beta, tasks.gamma]);

    await page.reload();
    await expect(page.getByRole("searchbox", { name: "Поиск задач" })).toHaveValue(token);
    await expect(page.getByText("Найдено 3 задачи", { exact: true })).toBeVisible();

    await searchTasks(page, true, uniqueToken());
    await expect(page.getByText("Ничего не найдено", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Закрыть поиск" }).click();
    await expect(page).toHaveURL((url) => param("q")(url) === null);
    await expect(page.getByRole("tablist", { name: "Статусы задач" })).toBeVisible();
  });
});

test("тёмная тема включается и сохраняется после перезагрузки", async ({ page, isMobile }) => {
  const user = await registerUser(page);
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);

  if (isMobile) {
    await userMenuButton(page, user.name).click();
    await page.getByRole("menuitemcheckbox", { name: "Тёмная тема" }).click();
    await page.keyboard.press("Escape");
  } else {
    await page.getByRole("button", { name: "Тёмная тема" }).click();
  }
  await expect(html).toHaveClass(/\bdark\b/);

  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  if (!isMobile) {
    await expect(page.getByRole("button", { name: "Тёмная тема" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Светлая тема" }).click();
    await expect(html).not.toHaveClass(/\bdark\b/);
  }
});

test("страницы не прокручиваются по горизонтали", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("textbox", { name: "Логин" })).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.goto("/register");
  await expect(page.getByRole("textbox", { name: "Имя" })).toBeVisible();
  await expectNoHorizontalScroll(page);

  await registerUser(page);
  await expectNoHorizontalScroll(page);
});
