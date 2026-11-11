"use client";

import { Check, ChevronRight } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";
import { MENU_ITEM_CLASS_NAME, POPOVER_SURFACE_CLASS_NAME } from "./menu-styles";

/**
 * Меню по кнопке: «⋯» на карточке (Редактировать / Изменить статус › / Удалить),
 * меню пользователя, фильтры с флажками. Построено на Radix — стрелки, Esc,
 * возврат фокуса и подменю работают из коробки.
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(POPOVER_SURFACE_CLASS_NAME, "min-w-52 p-1", className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export type DropdownMenuItemProps = ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  readonly icon?: ReactNode;
  /** Красный пункт («Удалить»). */
  readonly variant?: "default" | "danger";
};

export function DropdownMenuItem({
  icon,
  variant = "default",
  className,
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        MENU_ITEM_CLASS_NAME,
        variant === "danger" && "text-danger-text data-highlighted:bg-danger-soft",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

export function DropdownMenuSubTrigger({
  icon,
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & { readonly icon?: ReactNode }) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(MENU_ITEM_CLASS_NAME, "data-[state=open]:bg-surface-muted", className)}
      {...props}
    >
      {icon}
      {children}
      <ChevronRight aria-hidden="true" className="text-muted ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        sideOffset={sideOffset}
        className={cn(POPOVER_SURFACE_CLASS_NAME, "min-w-44 p-1", className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

/** Пункт-флажок без галочки: своё оформление состояния (например, переключатель темы). */
export function DropdownMenuCheckboxItemBase({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(MENU_ITEM_CLASS_NAME, className)}
      {...props}
    />
  );
}

/** Пункт-флажок: для фильтров, где можно выбрать несколько значений. */
export function DropdownMenuCheckboxItem({
  icon,
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & { readonly icon?: ReactNode }) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(MENU_ITEM_CLASS_NAME, "pr-9", className)}
      {...props}
    >
      {icon}
      {children}
      <DropdownMenuPrimitive.ItemIndicator className="text-primary-text absolute right-2.5 flex">
        <Check aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

/** Пункт-переключатель внутри DropdownMenuRadioGroup: например, выбор статуса в подменю. */
export function DropdownMenuRadioItem({
  icon,
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & { readonly icon?: ReactNode }) {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(MENU_ITEM_CLASS_NAME, "pr-9", className)}
      {...props}
    >
      {icon}
      {children}
      <DropdownMenuPrimitive.ItemIndicator className="text-primary-text absolute right-2.5 flex">
        <Check aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("text-caption text-muted px-2.5 py-2", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("bg-border mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}
