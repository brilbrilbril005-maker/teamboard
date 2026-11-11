/**
 * Тема оформления: светлая или тёмная. Выбор хранится в localStorage этого браузера;
 * пока человек ничего не выбрал, тема следует настройке системы.
 * Тёмная тема включается классом .dark на <html> (см. globals.css).
 */
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "teamboard-theme";
export const DARK_CLASS_NAME = "dark";
export const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Встроенный скрипт в <head>: ставит класс темы до первой отрисовки, поэтому
 * страница не мигает светлым фоном при тёмной теме. Ошибки доступа к хранилищу
 * (приватный режим) не мешают странице — остаётся системная тема.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=null;try{s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}var d=s===${JSON.stringify("dark")}||(s!==${JSON.stringify(
  "light",
)}&&window.matchMedia(${JSON.stringify(SYSTEM_DARK_QUERY)}).matches);document.documentElement.classList.toggle(${JSON.stringify(
  DARK_CLASS_NAME,
)},d)}catch(e){}})();`;
