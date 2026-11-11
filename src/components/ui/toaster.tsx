"use client";

import { CircleCheck, CircleExclamationPoint, X } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

/** Вид уведомления по макету: белая карточка, иконка слева, крестик справа. */
const TOAST_CLASS_NAMES = {
  toast:
    "group flex w-full items-center gap-3 rounded-card border border-border bg-surface py-3 pr-11 pl-4 text-foreground shadow-popover sm:w-[22rem]",
  content: "flex min-w-0 flex-1 flex-col gap-0.5",
  title: "text-body font-medium",
  description: "text-caption text-muted",
  icon: "flex shrink-0 [&_svg]:size-6",
  actionButton:
    "ml-1 shrink-0 cursor-pointer border-l border-border pl-3 text-body font-semibold text-primary-text hover:underline",
  closeButton:
    "absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-control text-muted hover:bg-surface-muted hover:text-foreground [&_svg]:size-4",
} as const;

/** Контейнер уведомлений. Один на приложение — в корневом layout.tsx. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      containerAriaLabel="Уведомления"
      closeButton
      visibleToasts={3}
      icons={{
        success: <CircleCheck className="text-success" />,
        error: <CircleExclamationPoint className="text-danger" />,
        close: <X />,
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: "Закрыть уведомление",
        classNames: TOAST_CLASS_NAMES,
      }}
    />
  );
}
