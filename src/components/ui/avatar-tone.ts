/**
 * Цвет аватара выбирается по постоянному ключу (id участника), а не по имени:
 * человек сохраняет цвет, даже если переименуется, и цвет одинаков на всех экранах.
 */
export const AVATAR_TONE_COUNT = 6;

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** Номер оттенка 0…AVATAR_TONE_COUNT-1 (хеш FNV-1a — короткий и стабильный). */
export function avatarToneIndex(key: string): number {
  let hash = FNV_OFFSET;
  for (const char of key) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash % AVATAR_TONE_COUNT;
}
