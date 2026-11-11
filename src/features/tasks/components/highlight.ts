/**
 * Подсветка совпадений с поисковым запросом: «Исправить [баг] в фильтрах».
 * Сервер ищет запрос целиком как подстроку без учёта регистра — подсвечиваем так же.
 */
export type TextPart = { readonly text: string; readonly match: boolean };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitByQuery(text: string, query: string | undefined): readonly TextPart[] {
  const needle = query?.trim();
  if (!needle) {
    return [{ text, match: false }];
  }
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const found of text.matchAll(new RegExp(escapeRegExp(needle), "giu"))) {
    if (found.index > cursor) {
      parts.push({ text: text.slice(cursor, found.index), match: false });
    }
    parts.push({ text: found[0], match: true });
    cursor = found.index + found[0].length;
  }
  if (cursor < text.length || parts.length === 0) {
    parts.push({ text: text.slice(cursor), match: false });
  }
  return parts;
}
