import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  boardColumn,
  changeStatusFromMenu,
  chooseOption,
  createTask,
  dueDateFromToday,
  expectToast,
  fillTaskForm,
  registerUser,
  taskCard,
  taskCardInStatus,
  taskDialog,
  taskMenuButton,
  toasts,
  uniqueToken,
} from "./helpers";

/**
 * Задачи: создание, редактирование, статусы, перетаскивание, удаление и права.
 * Каждый тест регистрирует своего пользователя и создаёт задачи с уникальной меткой,
 * поэтому тесты не зависят друг от друга и от порядка запуска.
 */

// Демо-задача, созданная пользователем anna (см. src/db/seed.ts). Тесты её не меняют.
const FOREIGN_TASK = "Подготовить презентацию для клиента";

async function openEditDialog(page: Page, title: string) {
  await page.getByRole("button", { name: title, exact: true }).click();
  const dialog = taskDialog(page, "Редактирование задачи");
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("создание задачи", () => {
  test("задача со всеми полями появляется в своём статусе с верными данными", async ({
    page,
    isMobile,
  }) => {
    await registerUser(page);
    const title = `Задача ${uniqueToken()}`;
    const description = "Описание задачи для сквозного теста";

    await createTask(page, {
      title,
      description,
      status: "В работе",
      assignee: "Максим Р.",
      priority: "Высокий",
      dueInDays: 1,
    });

    const card = await taskCardInStatus(page, isMobile, title, "В работе");
    await expect(card).toBeVisible();
    await expect(card).toContainText(description);
    await expect(card).toContainText("Высокий");
    await expect(card).toContainText("Завтра");
    await expect(card).toContainText("Максим Р.");

    await page.reload();
    await expect(await taskCardInStatus(page, isMobile, title, "В работе")).toBeVisible();
  });

  test("без названия задача не создаётся", async ({ page }) => {
    await registerUser(page);

    await page.getByRole("button", { name: "Создать задачу", exact: true }).click();
    const dialog = taskDialog(page, "Новая задача");
    await dialog.getByRole("button", { name: "Создать задачу" }).click();

    await expect(dialog.getByText("Введите название задачи")).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Название" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(dialog).toBeVisible();
  });
});

test("редактирование меняет название, ответственного, приоритет и дедлайн", async ({
  page,
  isMobile,
}) => {
  await registerUser(page);
  const title = `Черновик ${uniqueToken()}`;
  const renamed = `${title} (исправлено)`;
  const due = dueDateFromToday(4);
  await createTask(page, { title, priority: "Низкий" });

  const dialog = await openEditDialog(page, title);
  await fillTaskForm(page, dialog, {
    title: renamed,
    assignee: "Ольга К.",
    priority: "Высокий",
    dueInDays: 4,
  });
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(dialog).toBeHidden();
  await expectToast(page, "Изменения сохранены");

  const card = await taskCardInStatus(page, isMobile, renamed, "Новая");
  await expect(card).toContainText("Ольга К.");
  await expect(card).toContainText("Высокий");
  await expect(card).toContainText(due.short);
  await expect(page.getByRole("button", { name: title, exact: true })).toHaveCount(0);

  await page.reload();
  const reopened = await openEditDialog(page, renamed);
  await expect(reopened.getByRole("textbox", { name: "Название" })).toHaveValue(renamed);
  await expect(reopened.getByRole("combobox", { name: "Ответственный" })).toContainText("Ольга К.");
  await expect(reopened.getByRole("combobox", { name: "Приоритет" })).toContainText("Высокий");
  await expect(reopened.getByRole("button", { name: "Дедлайн" })).toHaveText(due.full);
});

test.describe("смена статуса", () => {
  test("через меню карточки, с отменой из уведомления", async ({ page, isMobile }) => {
    await registerUser(page);
    const title = `Статус ${uniqueToken()}`;
    await createTask(page, { title });

    const card = await taskCardInStatus(page, isMobile, title, "Новая");
    await changeStatusFromMenu(page, isMobile, card, title, "Завершена");
    await expect(await taskCardInStatus(page, isMobile, title, "Завершена")).toBeVisible();

    await toasts(page).getByRole("button", { name: "Отменить" }).click();
    await expect(await taskCardInStatus(page, isMobile, title, "Новая")).toBeVisible();

    await page.reload();
    await expect(await taskCardInStatus(page, isMobile, title, "Новая")).toBeVisible();

    await changeStatusFromMenu(
      page,
      isMobile,
      await taskCardInStatus(page, isMobile, title, "Новая"),
      title,
      "В работе",
    );
    await page.reload();
    await expect(await taskCardInStatus(page, isMobile, title, "В работе")).toBeVisible();
  });

  test("через окно редактирования", async ({ page, isMobile }) => {
    await registerUser(page);
    const title = `Окно ${uniqueToken()}`;
    await createTask(page, { title });

    const dialog = await openEditDialog(page, title);
    await chooseOption(page, dialog, "Статус", "Завершена");
    await dialog.getByRole("button", { name: "Сохранить" }).click();
    await expectToast(page, "Изменения сохранены");

    await page.reload();
    await expect(await taskCardInStatus(page, isMobile, title, "Завершена")).toBeVisible();
  });

  test("через выпадающий список в режиме «Список»", async ({ page, isMobile }) => {
    test.skip(isMobile, "Режим «Список» есть только на широком экране");
    await registerUser(page);
    const title = `Список ${uniqueToken()}`;
    await createTask(page, { title });

    await page.getByRole("radio", { name: "Список" }).click();
    await expect(page.getByRole("table")).toBeVisible();
    const select = page.getByRole("combobox", { name: `Статус задачи «${title}»` });
    await select.click();
    await page.getByRole("option", { name: "Завершена", exact: true }).click();
    await expectToast(page, "Статус изменён на «Завершена».");

    await page.reload();
    await expect(select).toContainText("Завершена");
  });
});

test.describe("перетаскивание на доске", () => {
  test.skip(({ isMobile }) => isMobile, "На телефоне колонок нет — статус меняют через меню");

  test("мышью: карточка переезжает в другую колонку и остаётся там", async ({ page }) => {
    await registerUser(page);
    const title = `Мышь ${uniqueToken()}`;
    await createTask(page, { title });

    const card = taskCard(boardColumn(page, "Новая"), title);
    const target = boardColumn(page, "В работе");
    // Мышь работает в координатах окна, поэтому карточку сначала прокручиваем в зону видимости.
    await card.scrollIntoViewIfNeeded();
    const from = await card.boundingBox();
    const to = await target.boundingBox();
    if (!from || !to) {
      throw new Error("Карточка или колонка не видна");
    }
    // Берём карточку за нижнюю часть (не за кнопку меню) и ведём шагами: dnd-kit
    // начинает перетаскивание только после сдвига на несколько пикселей.
    // Колонки высокие, поэтому соседняя колонка есть на той же высоте, что и карточка.
    const startX = from.x + from.width / 2;
    const startY = from.y + from.height - 12;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 12, startY, { steps: 4 });
    await page.mouse.move(to.x + to.width / 2, startY, { steps: 20 });
    await page.mouse.up();

    await expectToast(page, "Статус изменён на «В работе».");
    await expect(taskCard(target, title)).toBeVisible();
    await expect(taskDialog(page, "Редактирование задачи")).toBeHidden();

    await page.reload();
    await expect(taskCard(boardColumn(page, "В работе"), title)).toBeVisible();
  });

  test("с клавиатуры: пробел, стрелка, пробел", async ({ page }) => {
    await registerUser(page);
    const title = `Клавиатура ${uniqueToken()}`;
    await createTask(page, { title });

    await page
      .getByRole("button", { name: `Переместить задачу «${title}» в другую колонку` })
      .focus();
    // Каждый шаг ждём по объявлению для диктора, а затем ещё два кадра: dnd-kit
    // измеряет колонки в следующем кадре, и стрелка «раньше человека» пропала бы.
    const afterAnnouncement = async (column: string) => {
      await expect(page.getByText(`над колонкой «${column}»`)).toBeAttached();
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
    };
    await page.keyboard.press("Space");
    // Сразу после «поднята» доска сообщает, над какой колонкой карточка.
    await afterAnnouncement("Новая");
    await page.keyboard.press("ArrowRight");
    await afterAnnouncement("В работе");
    await page.keyboard.press("ArrowRight");
    await afterAnnouncement("Завершена");
    await page.keyboard.press("Space");

    await expectToast(page, "Статус изменён на «Завершена».");
    await page.reload();
    await expect(taskCard(boardColumn(page, "Завершена"), title)).toBeVisible();
  });
});

test.describe("удаление", () => {
  test("автор удаляет свою задачу после подтверждения", async ({ page, isMobile }) => {
    await registerUser(page);
    const title = `Удалить ${uniqueToken()}`;
    await createTask(page, { title });

    const card = await taskCardInStatus(page, isMobile, title, "Новая");
    await taskMenuButton(card, title).click();
    await page.getByRole("menuitem", { name: "Удалить" }).click();

    const confirm = page.getByRole("alertdialog", { name: "Удалить задачу?" });
    await expect(confirm).toContainText(title);
    await confirm.getByRole("button", { name: "Удалить" }).click();
    await expect(confirm).toBeHidden();
    await expectToast(page, "Задача удалена");
    await expect(card).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("button", { name: title, exact: true })).toHaveCount(0);
  });

  test("отмена подтверждения оставляет задачу", async ({ page, isMobile }) => {
    await registerUser(page);
    const title = `Оставить ${uniqueToken()}`;
    await createTask(page, { title });

    const dialog = await openEditDialog(page, title);
    await dialog.getByRole("button", { name: "Удалить задачу" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Удалить задачу?" });
    await confirm.getByRole("button", { name: "Отмена" }).click();
    await expect(confirm).toBeHidden();

    await page.reload();
    await expect(await taskCardInStatus(page, isMobile, title, "Новая")).toBeVisible();
  });

  test("у чужой задачи нет удаления ни в меню, ни в окне", async ({ page, isMobile }) => {
    await registerUser(page);

    const card = await taskCardInStatus(page, isMobile, FOREIGN_TASK, "Новая");
    await taskMenuButton(card, FOREIGN_TASK).click();
    await expect(page.getByRole("menuitem", { name: "Редактировать" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Удалить" })).toHaveCount(0);
    await page.keyboard.press("Escape");

    const dialog = await openEditDialog(page, FOREIGN_TASK);
    await expect(dialog.getByRole("button", { name: "Сохранить" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Удалить задачу" })).toHaveCount(0);
  });
});
