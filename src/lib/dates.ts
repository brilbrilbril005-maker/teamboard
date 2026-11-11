/** Дата без времени в формате ГГГГ-ММ-ДД. Так дедлайн не «съезжает» из-за часовых поясов. */
export type IsoDate = string;

/**
 * Часовой пояс команды. «Сегодня» (а значит, и «просрочено») считается в нём
 * одинаково на сервере и в браузере — независимо от того, в каком поясе
 * работает сервер (в Docker это обычно UTC).
 */
export const APP_TIME_ZONE = "Europe/Moscow";

/** Дата в формате ГГГГ-ММ-ДД в указанном часовом поясе. */
export function toIsoDate(date: Date, timeZone: string): IsoDate {
  // Локаль en-CA даёт формат ГГГГ-ММ-ДД.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Сегодняшняя дата в часовом поясе команды. */
export function todayIso(now: Date = new Date()): IsoDate {
  return toIsoDate(now, APP_TIME_ZONE);
}

const MS_IN_DAY = 24 * 60 * 60 * 1000;

/** Дата через указанное число дней от «сегодня» в поясе команды (отрицательное — в прошлом). */
export function isoDateFromToday(days: number, now: Date = new Date()): IsoDate {
  return todayIso(new Date(now.getTime() + days * MS_IN_DAY));
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type DateParts = { readonly year: number; readonly month: number; readonly day: number };

/** Разбирает ГГГГ-ММ-ДД и проверяет, что такой день существует (не 30 февраля). */
function parseIsoDate(value: string): DateParts | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  const exists =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  return exists ? { year, month, day } : null;
}

function requireIsoDate(value: IsoDate): DateParts {
  const parts = parseIsoDate(value);
  if (!parts) {
    throw new RangeError(`Неверная дата: ${value}`);
  }
  return parts;
}

const pad = (value: number) => String(value).padStart(2, "0");

export function isIsoDate(value: string): value is IsoDate {
  return parseIsoDate(value) !== null;
}

/**
 * Полночь указанного дня по местному времени браузера — так дату понимают календари.
 * Обратное преобразование — localDateToIso(). Ни там ни там нет перевода через UTC,
 * поэтому выбранный день не «съезжает» в другом часовом поясе.
 */
export function isoToLocalDate(value: IsoDate): Date {
  const { year, month, day } = requireIsoDate(value);
  return new Date(year, month - 1, day);
}

/** День по местному времени Date в формате ГГГГ-ММ-ДД (время отбрасывается). */
export function localDateToIso(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Дата на days дней позже (раньше при отрицательном значении). */
export function addDaysIso(value: IsoDate, days: number): IsoDate {
  const { year, month, day } = requireIsoDate(value);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

// Форматируем в UTC от полуночи UTC: результат не зависит от пояса сервера или браузера.
const shortDateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const fullDateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function toUtcMidnight(value: IsoDate): Date {
  const { year, month, day } = requireIsoDate(value);
  return new Date(Date.UTC(year, month - 1, day));
}

/** «15 нояб.», «8 мая». */
export function formatShortDate(value: IsoDate): string {
  return shortDateFormat.format(toUtcMidnight(value));
}

/** «8 нояб. 2026» — без «г.» в конце, как в макетах. */
export function formatFullDate(value: IsoDate): string {
  return fullDateFormat
    .formatToParts(toUtcMidnight(value))
    .filter((part) => part.type === "day" || part.type === "month" || part.type === "year")
    .map((part) => part.value)
    .join(" ");
}
