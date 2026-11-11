import { fail, type ActionResult } from "@/lib/result";
import type { useTrackMutation } from "./save-status";

type TrackMutation = ReturnType<typeof useTrackMutation>;

export const NETWORK_ERROR_MESSAGE =
  "Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.";

/**
 * Запускает изменение задачи через индикатор сохранения.
 * Действия сами ошибок не бросают, но запрос может не дойти до сервера (нет сети) —
 * тогда возвращаем обычную ошибку, чтобы окно показало её, а не упало.
 */
export async function runTaskMutation<T>(
  track: TrackMutation,
  mutate: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await track(mutate());
  } catch {
    return fail({ code: "INTERNAL", message: NETWORK_ERROR_MESSAGE });
  }
}
