"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "./cn";
import { POPOVER_SURFACE_CLASS_NAME } from "./menu-styles";

/** Всплывающая панель у кнопки (календарь, фильтр с поиском). */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({
  className,
  sideOffset = 6,
  align = "start",
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        collisionPadding={8}
        className={cn(POPOVER_SURFACE_CLASS_NAME, "p-1", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
