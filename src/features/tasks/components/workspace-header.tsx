"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import type { Ref } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme";
import { SaveStatusIndicator } from "./save-status-indicator";
import { UserMenu } from "./user-menu";

export const PAGE_TITLE = "Задачи команды";

function Divider() {
  return <span aria-hidden="true" className="bg-border h-7 w-px shrink-0" />;
}

/** Шапка от 768px: заголовок, «Все изменения сохранены», тема, меню пользователя. */
export function DesktopHeader() {
  return (
    <header className="hidden items-center gap-4 py-6 md:flex">
      <Logo size="sm" className="mr-2 lg:hidden" />
      <h1 className="text-h2 xl:text-h1 truncate">{PAGE_TITLE}</h1>
      <div className="ml-auto flex shrink-0 items-center gap-4">
        <SaveStatusIndicator variant="compact" className="lg:hidden" />
        <SaveStatusIndicator className="hidden lg:inline-flex" />
        <Divider />
        <ThemeToggle />
        <Divider />
        <UserMenu />
      </div>
    </header>
  );
}

/** Шапка телефона: логотип, кнопка поиска, аватар с меню. */
export function MobileHeader({
  onOpenSearch,
  isSearchOpen,
  searchButtonRef,
}: {
  readonly onOpenSearch: () => void;
  readonly isSearchOpen: boolean;
  /** Кнопка «Поиск задач»: на неё возвращается фокус после закрытия поиска. */
  readonly searchButtonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <header className="flex items-center gap-3 py-3 md:hidden">
      <Logo size="sm" />
      <div className="ml-auto flex items-center gap-3">
        {isSearchOpen ? null : (
          <IconButton
            ref={searchButtonRef}
            label="Поиск задач"
            icon={<Search />}
            variant="secondary"
            onClick={onOpenSearch}
          />
        )}
        <UserMenu compact />
      </div>
    </header>
  );
}

/** «Задачи команды» и кнопка фильтров с числом включённых групп. */
export function MobileTitleRow({
  activeFilterCount,
  onOpenFilters,
  filtersButtonRef,
}: {
  readonly activeFilterCount: number;
  readonly onOpenFilters: () => void;
  /** Кнопка «Фильтры»: на неё возвращается фокус после закрытия шторки. */
  readonly filtersButtonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 md:hidden">
      <h1 className="text-h2">{PAGE_TITLE}</h1>
      <span className="relative">
        <IconButton
          ref={filtersButtonRef}
          label={activeFilterCount > 0 ? `Фильтры: включено ${activeFilterCount}` : "Фильтры"}
          icon={<SlidersHorizontal />}
          variant="secondary"
          onClick={onOpenFilters}
        />
        {activeFilterCount > 0 ? (
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground text-caption absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full px-1 font-semibold"
          >
            {activeFilterCount}
          </span>
        ) : null}
      </span>
    </div>
  );
}
