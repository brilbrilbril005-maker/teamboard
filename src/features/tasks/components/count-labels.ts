/**
 * Подписи с числами по правилам русского языка: «1 задача», «3 задачи», «5 задач».
 * Чистые функции — проверяются обычными тестами.
 */

/** Формы слова: для 1 (21, 31…), для 2–4 (22–24…), для остальных (5–20, 25…). */
export type PluralForms = readonly [one: string, few: string, many: string];

export function pluralRu(count: number, [one, few, many]: PluralForms): string {
  const abs = Math.abs(count);
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return many;
  }
  if (last === 1) {
    return one;
  }
  if (last >= 2 && last <= 4) {
    return few;
  }
  return many;
}

const TASK_NOMINATIVE: PluralForms = ["задача", "задачи", "задач"];
const TASK_ACCUSATIVE: PluralForms = ["задачу", "задачи", "задач"];
// После «из»: «из 1 задачи», «из 21 задачи», «из 3 задач», «из 9 задач».
const TASK_GENITIVE: PluralForms = ["задачи", "задач", "задач"];
const FOUND: PluralForms = ["Найдена", "Найдено", "Найдено"];
const SHOWN: PluralForms = ["Показана", "Показано", "Показано"];

/** «4 задачи» — для подписей счётчиков. */
export function tasksCountLabel(count: number): string {
  return `${count} ${pluralRu(count, TASK_NOMINATIVE)}`;
}

/** «Найдена 1 задача», «Найдено 3 задачи», «Ничего не найдено». */
export function foundTasksLabel(count: number): string {
  if (count === 0) {
    return "Ничего не найдено";
  }
  return `${pluralRu(count, FOUND)} ${tasksCountLabel(count)}`;
}

/** Кнопка мобильных фильтров: «Показать 1 задачу», «Показать 3 задачи», «Нет задач». */
export function showTasksLabel(count: number): string {
  if (count === 0) {
    return "Нет подходящих задач";
  }
  return `Показать ${count} ${pluralRu(count, TASK_ACCUSATIVE)}`;
}

/** Под списком: «Показано 3 из 9 задач», «Показана 1 из 21 задачи». */
export function shownOfTotalLabel(shown: number, total: number): string {
  return `${pluralRu(shown, SHOWN)} ${shown} из ${total} ${pluralRu(total, TASK_GENITIVE)}`;
}
