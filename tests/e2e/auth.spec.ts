import type { Page } from "@playwright/test";
import { expect, test, uniqueUsername } from "./fixtures";

const PASSWORD = "e2e-password-123";

// Next.js держит предыдущие страницы в документе скрытыми (см. CLAUDE.md, «Особенности»),
// поэтому поля ищем по роли — такой поиск видит только то, что видит пользователь.
// У поля пароля роли нет, для него явно берём видимое.
const loginField = (page: Page) => page.getByRole("textbox", { name: "Логин" });
const nameField = (page: Page) => page.getByRole("textbox", { name: "Имя" });
const passwordField = (page: Page) => page.getByLabel("Пароль").filter({ visible: true });

test.describe("вход и регистрация", () => {
  test("гость попадает на страницу входа", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginField(page)).toBeVisible();
  });

  test("демо-вход открывает приложение, выход возвращает на страницу входа", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Войти как демо" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Анна Смирнова").first()).toBeVisible();
    for (const name of ["Анна Смирнова", "Ольга Кузнецова", "Максим Романов", "Дмитрий Лебедев"]) {
      await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();
    }

    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("новый пользователь регистрируется, выходит и входит по логину и паролю", async ({
    page,
  }) => {
    const username = uniqueUsername();

    await page.goto("/register");
    await loginField(page).fill(username);
    await nameField(page).fill("Тестовый Пользователь");
    await passwordField(page).fill(PASSWORD);
    await page.getByRole("button", { name: "Зарегистрироваться" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(`@${username}`).first()).toBeVisible();

    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Логин не чувствителен к регистру.
    await loginField(page).fill(username.toUpperCase());
    await passwordField(page).fill(PASSWORD);
    await page.getByRole("button", { name: "Войти", exact: true }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Тестовый Пользователь").first()).toBeVisible();
  });

  test("сессия сохраняется после перезагрузки страницы", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Войти как демо" }).click();
    await expect(page.getByText("Анна Смирнова").first()).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Анна Смирнова").first()).toBeVisible();
  });

  test("занятый логин зарегистрировать нельзя", async ({ page }) => {
    await page.goto("/register");
    await loginField(page).fill("anna");
    await nameField(page).fill("Другая Анна");
    await passwordField(page).fill(PASSWORD);
    await page.getByRole("button", { name: "Зарегистрироваться" }).click();

    await expect(page.getByText("Этот логин уже занят")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("неверный пароль и несуществующий логин дают один и тот же ответ", async ({ page }) => {
    // Сообщение ищем внутри формы: у Next.js есть собственный служебный элемент с ролью alert.
    const formError = page.locator("form").getByRole("alert");
    const submit = page.getByRole("button", { name: "Войти", exact: true });

    await page.goto("/login");
    await loginField(page).fill("olga");
    await passwordField(page).fill("wrong-password");
    await submit.click();
    await expect(formError).toHaveText("Неверный логин или пароль");

    await page.reload();
    await loginField(page).fill(uniqueUsername("ghost"));
    await passwordField(page).fill("wrong-password");
    await submit.click();
    await expect(formError).toHaveText("Неверный логин или пароль");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("вошедшего пользователя со страницы входа отправляет в приложение", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Войти как демо" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/login");

    await expect(page).toHaveURL(/\/$/);
  });
});

test("проверка здоровья отвечает без входа", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
