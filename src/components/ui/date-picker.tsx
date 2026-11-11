"use client";

import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import {
  formatFullDate,
  isoToLocalDate,
  localDateToIso,
  todayIso,
  type IsoDate,
} from "@/lib/dates";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { cn } from "./cn";
import { CONTROL_CLASS_NAME, CONTROL_HEIGHT_CLASS_NAME } from "./control-styles";
import { useFieldControl } from "./field";
import { IconButton } from "./icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type DatePickerProps = {
  /** Выбранный день строкой ГГГГ-ММ-ДД или null — дата не выбрана. */
  readonly value: IsoDate | null;
  readonly onValueChange: (value: IsoDate | null) => void;
  readonly placeholder?: string;
  /** Имя для отправки в форме: значение уходит скрытым полем (пустая строка — без даты). */
  readonly name?: string;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  /** Показать крестик «Убрать дату». */
  readonly clearable?: boolean;
  readonly className?: string;
  readonly "aria-describedby"?: string;
};

/**
 * Поле выбора даты с календарём. Значение — строка ГГГГ-ММ-ДД, без времени и часовых поясов:
 * какой день нажали, такой и сохранится. «Сегодня» — по часовому поясу команды (todayIso()).
 */
export function DatePicker({
  value,
  onValueChange,
  placeholder = "Выберите дату",
  name,
  id,
  disabled,
  invalid,
  clearable = true,
  className,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const control = useFieldControl({ id, invalid, "aria-describedby": ariaDescribedBy });

  const choose = (date: Date | undefined) => {
    onValueChange(date ? localDateToIso(date) : null);
    setOpen(false);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={control.id}
          disabled={disabled}
          aria-describedby={control["aria-describedby"]}
          aria-invalid={control["aria-invalid"]}
          className={cn(
            CONTROL_CLASS_NAME,
            CONTROL_HEIGHT_CLASS_NAME,
            "data-[state=open]:border-primary flex cursor-pointer items-center gap-2 px-3 text-left",
            value && clearable ? "pr-11" : null,
          )}
        >
          <CalendarDays aria-hidden="true" className="text-muted size-5 shrink-0" />
          <span className={cn("truncate", !value && "text-muted")}>
            {value ? formatFullDate(value) : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent className="p-0" onOpenAutoFocus={focusCalendarDay}>
          <DatePickerCalendar value={value} onChoose={choose} />
        </PopoverContent>
      </Popover>
      {value && clearable && !disabled ? (
        <IconButton
          size="sm"
          label="Убрать дату"
          icon={<X />}
          className="absolute right-1"
          onClick={() => onValueChange(null)}
        />
      ) : null}
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
    </div>
  );
}

/**
 * При открытии фокус — на выбранный день или на сегодня (календарь помечает его
 * data-focused), чтобы стрелки сразу двигали день. Без этого Radix ставил фокус
 * на первую кнопку панели — «Перейти к предыдущему месяцу».
 */
function focusCalendarDay(event: Event) {
  const day =
    event.currentTarget instanceof HTMLElement
      ? event.currentTarget.querySelector<HTMLElement>('[data-focused="true"] button')
      : null;
  if (day) {
    event.preventDefault();
    day.focus();
  }
}

/**
 * Содержимое всплывающей панели. Отрисовывается только когда панель открыта — то есть
 * в браузере, — поэтому «сегодня» не вычисляется при предварительной отрисовке на сервере.
 */
function DatePickerCalendar({
  value,
  onChoose,
}: {
  readonly value: IsoDate | null;
  readonly onChoose: (date: Date | undefined) => void;
}) {
  const selected = value ? isoToLocalDate(value) : undefined;
  const today = isoToLocalDate(todayIso());

  return (
    <>
      <Calendar
        selected={selected}
        onSelect={onChoose}
        today={today}
        defaultMonth={selected ?? today}
        autoFocus
      />
      <div className="border-border border-t px-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => onChoose(today)}>
          Сегодня
        </Button>
      </div>
    </>
  );
}
