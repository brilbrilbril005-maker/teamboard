/**
 * Тема оформления: светлая или тёмная. По умолчанию — светлая (как в макетах), даже если
 * в системе включена тёмная. Выбор человека хранится в localStorage этого браузера.
 * Тёмная тема включается классом .dark на <html> (см. globals.css).
 */
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "teamboard-theme";
export const DARK_CLASS_NAME = "dark";

/**
 * Встроенный скрипт в <head>: ставит класс темы до первой отрисовки, поэтому
 * страница не мигает светлым фоном при тёмной теме. Ошибки доступа к хранилищу
 * (приватный режим) не мешают странице — остаётся светлая тема.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=null;try{s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}document.documentElement.classList.toggle(${JSON.stringify(
  DARK_CLASS_NAME,
)},s===${JSON.stringify("dark")})}catch(e){}})();`;
