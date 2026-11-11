"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ActionResult } from "@/lib/result";

/**
 * Индикатор «Все изменения сохранены» в шапке.
 * Любое изменение задач оборачивается в track(): пока запрос идёт — «Сохранение…»,
 * если сервер вернул ошибку — «Не удалось сохранить».
 *
 * КОНТРАКТ между частями интерфейса: доска, список и окна задач пользуются
 * только useTrackMutation() и useSaveStatus(). Сигнатуры не менять без нужды.
 */
export type SaveState = "saved" | "saving" | "error";

type TrackMutation = <T>(promise: Promise<ActionResult<T>>) => Promise<ActionResult<T>>;

type SaveStatusContextValue = {
  readonly state: SaveState;
  readonly track: TrackMutation;
};

const SaveStatusContext = createContext<SaveStatusContextValue | null>(null);

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(false);

  const track = useCallback<TrackMutation>(async (promise) => {
    setPending((count) => count + 1);
    try {
      const result = await promise;
      setFailed(!result.ok);
      return result;
    } catch (error: unknown) {
      setFailed(true);
      throw error;
    } finally {
      setPending((count) => count - 1);
    }
  }, []);

  const state: SaveState = pending > 0 ? "saving" : failed ? "error" : "saved";
  const value = useMemo(() => ({ state, track }), [state, track]);

  return <SaveStatusContext value={value}>{children}</SaveStatusContext>;
}

function useSaveStatusContext(): SaveStatusContextValue {
  const context = useContext(SaveStatusContext);
  if (!context) {
    throw new Error("SaveStatusProvider не подключён");
  }
  return context;
}

export function useSaveStatus(): SaveState {
  return useSaveStatusContext().state;
}

export function useTrackMutation(): TrackMutation {
  return useSaveStatusContext().track;
}
