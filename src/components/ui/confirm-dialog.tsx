"use client";

import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import {
  DIALOG_OVERLAY_CLASS_NAME,
  DIALOG_SIZE_CLASS_NAME,
  dialogPanelClassName,
} from "./dialog-styles";
import { SheetHandle } from "./dialog";

export type ConfirmDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** Текст на кнопке во время действия, например «Удаление…». */
  readonly pendingLabel?: string;
  /** Идёт действие: кнопки неактивны, окно нельзя закрыть. */
  readonly pending?: boolean;
  readonly tone?: "danger" | "primary";
  /** Окно не закрывается само: закройте его через onOpenChange(false), когда действие удалось. */
  readonly onConfirm: () => void;
};

/**
 * Подтверждение необратимого действия («Удалить задачу?»).
 * Построено на AlertDialog: фокус сразу на «Отмена», клик по фону окно не закрывает.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Удалить",
  cancelLabel = "Отмена",
  pendingLabel = "Удаление…",
  pending = false,
  tone = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const handleOpenChange = (next: boolean) => {
    if (!pending) {
      onOpenChange(next);
    }
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={DIALOG_OVERLAY_CLASS_NAME} />
        <AlertDialogPrimitive.Content
          className={cn(dialogPanelClassName("responsive"), DIALOG_SIZE_CLASS_NAME.sm)}
        >
          <SheetHandle />
          <AlertDialogPrimitive.Title className="text-h2 text-balance">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="text-body text-foreground mt-3">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:*:flex-1">
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              loading={pending}
              loadingText={pendingLabel}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="secondary" disabled={pending}>
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
