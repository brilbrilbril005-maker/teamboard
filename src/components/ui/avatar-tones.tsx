"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { assignAvatarTones, avatarToneIndex } from "./avatar-tone";

const AvatarTonesContext = createContext<ReadonlyMap<string, number> | null>(null);

/**
 * Раздаёт оттенки аватаров всей команде сразу, чтобы у участников не совпадали цвета.
 * Без провайдера аватар берёт оттенок по хешу своего ключа.
 */
export function AvatarTonesProvider({
  keys,
  children,
}: {
  readonly keys: readonly string[];
  readonly children: ReactNode;
}) {
  const tones = useMemo(() => assignAvatarTones(keys), [keys]);
  return <AvatarTonesContext value={tones}>{children}</AvatarTonesContext>;
}

/** Номер оттенка для ключа (id участника). */
export function useAvatarTone(key: string): number {
  const tones = useContext(AvatarTonesContext);
  return tones?.get(key) ?? avatarToneIndex(key);
}
