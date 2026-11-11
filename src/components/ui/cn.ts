import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge не знает наших токенов из globals.css: без подсказки он примет
 * «text-caption» за цвет текста и выкинет его рядом с «text-muted».
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["h1", "h2", "body", "caption"],
      radius: ["control", "card", "dialog"],
      shadow: ["card", "popover", "drag"],
    },
  },
});

/**
 * Склеивает классы Tailwind и убирает конфликтующие: cn("px-2", "px-4") → "px-4".
 * Так компонент можно донастроить снаружи через className.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
