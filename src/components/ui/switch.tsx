"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "./cn";

const TRACK =
  "inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-border-strong p-0.5 transition-colors";
const THUMB = "block size-5 rounded-full bg-white shadow-card transition-transform";

/**
 * Переключатель «вкл/выкл» («Тёмная тема», «Только просроченные»).
 * Подпись обязательна: <label> рядом с htmlFor/id или aria-label.
 */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        TRACK,
        "data-[state=checked]:bg-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className={cn(THUMB, "data-[state=checked]:translate-x-4")} />
    </SwitchPrimitive.Root>
  );
}

/** Только вид переключателя, без поведения: для пунктов меню, где состояние уже озвучено. */
export function SwitchVisual({ checked }: { readonly checked: boolean }) {
  return (
    <span aria-hidden="true" className={cn(TRACK, checked && "bg-primary")}>
      <span className={cn(THUMB, checked && "translate-x-4")} />
    </span>
  );
}
