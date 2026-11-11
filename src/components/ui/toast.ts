import { toast as sonnerToast, type ExternalToast } from "sonner";

const SUCCESS_DURATION_MS = 4000;
// Ошибку нужно успеть прочитать; уведомление с «Отменить» — успеть нажать.
const ERROR_DURATION_MS = 7000;
const ACTION_DURATION_MS = 6000;

export type ToastAction = {
  readonly label: string;
  readonly onClick: () => void;
};

export type ToastOptions = {
  readonly description?: string;
  /** Кнопка в уведомлении, например { label: "Отменить", onClick: undo }. */
  readonly action?: ToastAction;
  /** Повторный показ с тем же id заменяет уведомление, а не добавляет новое. */
  readonly id?: string | number;
  readonly duration?: number;
};

function toSonnerOptions(
  options: ToastOptions | undefined,
  defaultDuration: number,
): ExternalToast {
  const action = options?.action;
  return {
    id: options?.id,
    description: options?.description,
    duration: options?.duration ?? (action ? ACTION_DURATION_MS : defaultDuration),
    action: action ? { label: action.label, onClick: () => action.onClick() } : undefined,
  };
}

/**
 * Всплывающие уведомления. Вызываются из клиентского кода:
 *
 *   toast.success("Задача создана");
 *   toast.error(result.error.message);
 *   toast.success("Статус изменён на «Завершена»", { action: { label: "Отменить", onClick: undo } });
 *
 * Контейнер <Toaster /> (toaster.tsx) уже подключён в корневом layout.tsx.
 */
export const toast = {
  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, toSonnerOptions(options, SUCCESS_DURATION_MS)),
  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, toSonnerOptions(options, ERROR_DURATION_MS)),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};
