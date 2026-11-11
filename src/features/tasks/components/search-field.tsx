"use client";

import { Search, X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/components/ui/cn";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { useTaskWorkspace } from "./task-workspace-context";

type SearchFieldProps = Pick<ComponentProps<"input">, "autoFocus" | "className"> & {
  readonly containerClassName?: string;
  /** Что делает крестик: очищает поле (по умолчанию) или, на телефоне, ещё и закрывает поиск. */
  readonly onClear?: () => void;
  readonly clearLabel?: string;
  /** Показывать крестик даже при пустом поле (закрыть мобильный поиск). */
  readonly alwaysShowClear?: boolean;
};

/** «Поиск задач»: ищет по названию и описанию через 300 мс после ввода. */
export function SearchField({
  containerClassName,
  className,
  autoFocus,
  onClear,
  clearLabel = "Очистить поиск",
  alwaysShowClear = false,
}: SearchFieldProps) {
  const { search } = useTaskWorkspace();
  const handleClear = onClear ?? search.clear;
  const showClear = alwaysShowClear || search.draft !== "";

  return (
    <Input
      type="search"
      aria-label="Поиск задач"
      placeholder="Поиск задач"
      autoComplete="off"
      enterKeyHint="search"
      autoFocus={autoFocus}
      maxLength={search.maxLength}
      value={search.draft}
      onChange={(event) => search.setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && search.draft !== "") {
          event.preventDefault();
          search.clear();
        }
      }}
      icon={<Search />}
      className={cn("[&::-webkit-search-cancel-button]:appearance-none", className)}
      containerClassName={containerClassName}
      endSlot={
        showClear ? (
          <IconButton
            label={clearLabel}
            icon={<X />}
            size="sm"
            onClick={handleClear}
            className="m-1"
          />
        ) : undefined
      }
    />
  );
}
