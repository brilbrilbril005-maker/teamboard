/**
 * Общий вид полей ввода: обычное, наведение, фокус (синяя обводка),
 * ошибка (aria-invalid → красная обводка) и неактивное.
 * Используют Input, Textarea, Select и DatePicker — чтобы все поля выглядели одинаково.
 */
export const CONTROL_CLASS_NAME =
  "w-full rounded-control border border-border bg-surface text-body text-foreground transition-[border-color,box-shadow] placeholder:text-muted hover:border-border-strong focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted disabled:hover:border-border";

/** Высота однострочного поля: 40px (на телефоне 44px — удобнее попадать пальцем). */
export const CONTROL_HEIGHT_CLASS_NAME = "h-11 sm:h-10";
