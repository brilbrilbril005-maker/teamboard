import { splitByQuery } from "./highlight";

/** Текст с подсвеченными совпадениями поиска. */
export function HighlightedText({
  text,
  query,
}: {
  readonly text: string;
  readonly query?: string;
}) {
  const parts = splitByQuery(text, query);
  if (parts.length === 1 && !parts[0]?.match) {
    return text;
  }
  return parts.map((part, index) =>
    part.match ? (
      <mark key={index} className="bg-primary-soft text-primary-text rounded-sm px-px">
        {part.text}
      </mark>
    ) : (
      <span key={index}>{part.text}</span>
    ),
  );
}
