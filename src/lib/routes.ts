/** Адреса страниц. Меняются в одном месте. */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
} as const;

/** Страницы, доступные без входа. */
export const PUBLIC_ROUTES: readonly string[] = [ROUTES.login, ROUTES.register];
