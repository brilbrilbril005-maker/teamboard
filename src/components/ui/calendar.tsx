"use client";

import { DayPicker, type DayPickerProps } from "@daypicker/react";
import { ru } from "@daypicker/react/locale/ru";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NAV_BUTTON =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

const CLASS_NAMES: DayPickerProps["classNames"] = {
  root: "w-fit p-3",
  months: "relative flex flex-col",
  month: "flex flex-col gap-3",
  month_caption: "flex h-8 items-center justify-center",
  caption_label: "text-body font-semibold first-letter:uppercase",
  nav: "absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between",
  button_previous: NAV_BUTTON,
  button_next: NAV_BUTTON,
  month_grid: "border-collapse",
  weekday: "size-9 text-caption font-medium text-muted capitalize",
  day: "size-9 p-0 text-center",
  day_button:
    "inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-sm text-foreground tabular-nums transition-colors hover:bg-surface-muted",
  today: "font-semibold [&>button]:text-primary-text [&>button]:ring-1 [&>button]:ring-primary",
  selected:
    "[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:ring-0 [&>button:hover]:bg-primary-hover",
  outside: "[&>button]:text-muted",
  disabled: "[&>button]:cursor-not-allowed [&>button]:opacity-40",
  hidden: "invisible",
};

function Chevron({ orientation }: { readonly orientation?: "up" | "down" | "left" | "right" }) {
  const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
  return <Icon aria-hidden="true" className="size-4" />;
}

export type CalendarProps = {
  readonly selected: Date | undefined;
  readonly onSelect: (date: Date | undefined) => void;
  /** «Сегодня» для обводки — передавайте день в часовом поясе команды. */
  readonly today?: Date;
  readonly defaultMonth?: Date;
  readonly autoFocus?: boolean;
  readonly className?: string;
};

/**
 * Календарь выбора одного дня, по-русски: неделя с понедельника, сегодня обведено,
 * выбранный день залит. Для дедлайна используйте DatePicker — он сам переводит даты
 * в строку ГГГГ-ММ-ДД.
 */
export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      locale={ru}
      weekStartsOn={1}
      classNames={CLASS_NAMES}
      className={className}
      components={{ Chevron }}
      {...props}
    />
  );
}
