"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TASK_SEARCH_MAX_LENGTH } from "../model";

/** Пауза после последней нажатой клавиши, прежде чем искать. */
export const SEARCH_DEBOUNCE_MS = 300;

export type SearchDraft = {
  /** Текст в поле поиска (ещё не обязательно применён). */
  readonly draft: string;
  readonly setDraft: (value: string) => void;
  /** Очистить поле и сразу снять поиск. */
  readonly clear: () => void;
  readonly maxLength: number;
};

/**
 * Поле поиска с задержкой: запрос уходит через SEARCH_DEBOUNCE_MS после ввода.
 * Если поиск сменился снаружи (кнопка «Сбросить фильтры», переход по ссылке),
 * поле подхватывает новое значение; свой же отправленный запрос поле не перетирает.
 */
export function useSearchDraft(applied: string, commit: (search: string) => void): SearchDraft {
  const [draft, setDraft] = useState(applied);
  // Последнее значение поиска, о котором поле уже знает (своё отправленное или пришедшее).
  const [known, setKnown] = useState(applied);

  if (applied !== known) {
    setKnown(applied);
    setDraft(applied);
  }

  const send = useCallback(
    (value: string) => {
      setKnown(value);
      commit(value);
    },
    [commit],
  );

  useEffect(() => {
    const value = draft.trim();
    if (value === known) {
      return undefined;
    }
    const timer = setTimeout(() => send(value), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, known, send]);

  const clear = useCallback(() => {
    setDraft("");
    if (known !== "") {
      send("");
    }
  }, [known, send]);

  return useMemo(
    () => ({ draft, setDraft, clear, maxLength: TASK_SEARCH_MAX_LENGTH }),
    [draft, clear],
  );
}
