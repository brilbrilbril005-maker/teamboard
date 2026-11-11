import { CircleAlert } from "lucide-react";

/** Общая ошибка формы (не относящаяся к одному полю): «Неверный логин или пароль». */
export function FormError({ message }: { readonly message: string }) {
  return (
    <p
      role="alert"
      className="rounded-control bg-danger-soft text-danger-text flex items-start gap-2 px-3 py-2.5 text-sm font-medium"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
