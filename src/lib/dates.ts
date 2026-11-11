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
