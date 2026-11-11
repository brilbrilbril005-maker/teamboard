"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useId, useSyncExternalStore } from "react";
import { cn } from "./cn";
import { DropdownMenuCheckboxItemBase } from "./dropdown-menu";
import { Switch, SwitchVisual } from "./switch";
import { DARK_CLASS_NAME, THEME_STORAGE_KEY, type Theme } from "./theme-config";

const THEME_CHANGE_EVENT = "teamboard:theme-change";

function readTheme(): Theme {
  return document.documentElement.classList.contains(DARK_CLASS_NAME) ? "dark" : "light";
}

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle(DARK_CLASS_NAME, theme === "dark");
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  // Тему поменяли в другой вкладке. Без явного выбора — светлая.
  const syncFromStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(readStoredTheme() ?? "light");
    }
  };

  window.addEventListener("storage", syncFromStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", syncFromStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

/** На сервере выбор человека неизвестен — светлая тема по умолчанию; после загрузки уточняется. */
const getServerTheme = (): Theme => "light";

/** Текущая тема и смена темы (выбор запоминается в этом браузере). */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerTheme);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Хранилище недоступно (приватный режим) — тема сменится до перезагрузки.
    }
    applyTheme(next);
  }, []);

  return { theme, setTheme } as const;
}

const THEME_BUTTON =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] text-muted transition-colors hover:text-foreground [&_svg]:size-5";

/**
 * Переключатель темы «солнце / луна» в шапке. Подсветка выбранной кнопки задана
 * через CSS (dark:), а не состояние React, — поэтому не мигает при загрузке.
 */
export function ThemeToggle({ className }: { readonly className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Тема оформления"
      className={cn(
        "rounded-control border-border bg-surface inline-flex items-center gap-0.5 border p-0.5",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Светлая тема"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        className={cn(
          THEME_BUTTON,
          "bg-primary-soft text-primary-text dark:text-muted dark:bg-transparent",
        )}
      >
        <Sun aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Тёмная тема"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={cn(THEME_BUTTON, "dark:bg-primary-soft dark:text-primary-text")}
      >
        <Moon aria-hidden="true" />
      </button>
    </div>
  );
}

/** Строка «🌙 Тёмная тема [переключатель]» для меню пользователя. */
export function ThemeSwitch({ className }: { readonly className?: string }) {
  const { theme, setTheme } = useTheme();
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Moon aria-hidden="true" className="size-5 shrink-0" />
      <label htmlFor={id} className="text-body flex-1 cursor-pointer">
        Тёмная тема
      </label>
      <Switch
        id={id}
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  );
}

/**
 * Пункт «Тёмная тема» для меню пользователя (внутри DropdownMenuContent).
 * Это пункт-флажок меню: работает стрелками и пробелом, меню при нажатии не закрывается.
 */
export function ThemeMenuItem() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <DropdownMenuCheckboxItemBase
      checked={isDark}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      onSelect={(event) => event.preventDefault()}
    >
      <Moon aria-hidden="true" />
      <span className="flex-1">Тёмная тема</span>
      <SwitchVisual checked={isDark} />
    </DropdownMenuCheckboxItemBase>
  );
}
