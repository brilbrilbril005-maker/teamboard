import { THEME_INIT_SCRIPT } from "./theme-config";

/**
 * Ставит тему до отрисовки страницы. Подключается в <head> корневого layout.tsx.
 * Серверный компонент: скрипт попадает прямо в HTML и выполняется браузером сразу.
 */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
