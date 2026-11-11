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

/**
 * Оттенки для всей команды сразу: у каждого свой цвет, пока участников не больше,
 * чем оттенков. Начинаем с «своего» оттенка по хешу, занятый — берём следующий свободный.
 * Ключи обходятся в отсортированном порядке, поэтому раскладка не зависит от порядка
 * списка и одинакова на всех экранах; когда свободные оттенки кончаются, круг начинается заново.
 */
export function assignAvatarTones(keys: readonly string[]): ReadonlyMap<string, number> {
  const uniqueKeys = [...new Set(keys)].sort(); // сортируется свежая копия
  const assigned = uniqueKeys.reduce<{
    readonly tones: ReadonlyMap<string, number>;
    readonly used: ReadonlySet<number>;
  }>(
    ({ tones, used }, key) => {
      const free = used.size >= AVATAR_TONE_COUNT ? new Set<number>() : used;
      const tone = nextFreeTone(avatarToneIndex(key), free);
      return { tones: new Map(tones).set(key, tone), used: new Set(free).add(tone) };
    },
    { tones: new Map(), used: new Set() },
  );
  return assigned.tones;
}

function nextFreeTone(preferred: number, used: ReadonlySet<number>): number {
  const candidates = Array.from(
    { length: AVATAR_TONE_COUNT },
    (_, step) => (preferred + step) % AVATAR_TONE_COUNT,
  );
  return candidates.find((tone) => !used.has(tone)) ?? preferred;
}
