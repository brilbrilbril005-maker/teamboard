/**
 * Общая разметка страницы задач — для самой страницы и для её скелетона при загрузке.
 * Боковая панель закреплена слева от 1024px; ниже её функции — в панели инструментов
 * и мобильных фильтрах.
 */
export const WORKSPACE_SIDEBAR_CLASS_NAME =
  "border-border bg-background fixed inset-y-0 left-0 z-20 hidden w-68 flex-col overflow-y-auto border-r px-4 py-6 lg:flex";

export const WORKSPACE_CONTENT_CLASS_NAME =
  "mx-auto flex min-h-dvh w-full max-w-[100rem] flex-col px-4 pb-28 md:px-6 md:pb-10 lg:px-8";
