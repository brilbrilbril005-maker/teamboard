"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";
import {
  DIALOG_OVERLAY_CLASS_NAME,
  DIALOG_SIZE_CLASS_NAME,
  dialogPanelClassName,
  type DialogLayout,
  type DialogSize,
} from "./dialog-styles";
import { IconButton } from "./icon-button";

/**
 * Модальное окно: по центру на компьютере, нижняя шторка на телефоне (одна разметка).
 *
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent title="Новая задача">
 *       <form>…<DialogFooter>…</DialogFooter></form>
 *     </DialogContent>
 *   </Dialog>
 *
 * Фокус заперт внутри, Esc и клик по фону закрывают, фокус возвращается на кнопку.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export type DialogContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** "sheet" — шторка снизу на любом экране (мобильные фильтры). */
  readonly layout?: DialogLayout;
  readonly size?: DialogSize;
  readonly hideCloseButton?: boolean;
};

export function DialogContent({
  title,
  description,
  layout = "responsive",
  size = "md",
  hideCloseButton = false,
  className,
  children,
  ...props
}: DialogContentProps) {
  // Без описания явно говорим Radix, что связывать нечего, — иначе он предупреждает в консоли.
  const describedBy = description ? {} : { "aria-describedby": undefined };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={DIALOG_OVERLAY_CLASS_NAME} />
      <DialogPrimitive.Content
        {...describedBy}
        {...props}
        className={cn(dialogPanelClassName(layout), DIALOG_SIZE_CLASS_NAME[size], className)}
      >
        <SheetHandle layout={layout} />
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <DialogPrimitive.Title className="text-h2 text-balance">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-body text-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          {hideCloseButton ? null : (
            <DialogPrimitive.Close asChild>
              <IconButton label="Закрыть" icon={<X />} className="-mt-1 -mr-2" />
            </DialogPrimitive.Close>
          )}
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Полоска-«ручка» сверху шторки (только на телефоне). */
export function SheetHandle({ layout = "responsive" }: { readonly layout?: DialogLayout }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-border-strong mx-auto mb-3 h-1 w-10 shrink-0 rounded-full",
        layout === "responsive" && "sm:hidden",
      )}
    />
  );
}

/** Ряд кнопок внизу окна: на телефоне — столбиком на всю ширину, на компьютере — в строку. */
export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("mt-6 flex flex-col gap-3 sm:flex-row sm:*:flex-1", className)} {...props} />
  );
}
