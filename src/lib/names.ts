/**
 * Как показывать имя человека в тесных местах интерфейса (карточка, список, фильтр, аватар).
 * Чистые функции без React — проверяются обычными тестами.
 */

function words(name: string): string[] {
  return name.trim().split(/\s+/).filter(Boolean);
}

/** «Анна Смирнова» → «Анна С.»; одно слово остаётся как есть. */
export function shortName(name: string): string {
  const [first, second] = words(name);
  if (!first) {
    return "";
  }
  const initial = second?.charAt(0).toLocaleUpperCase("ru-RU");
  return initial ? `${first} ${initial}.` : first;
}

/** Первая буква имени для аватара: «анна» → «А». */
export function nameInitial(name: string): string {
  const [first] = words(name);
  return first ? first.charAt(0).toLocaleUpperCase("ru-RU") : "?";
}
