import { nameInitial } from "@/lib/names";
import { avatarToneIndex } from "./avatar-tone";
import { cn } from "./cn";

// Полные имена классов: Tailwind находит их в исходниках только целиком.
const TONES = [
  "bg-avatar-1 text-avatar-1-text",
  "bg-avatar-2 text-avatar-2-text",
  "bg-avatar-3 text-avatar-3-text",
  "bg-avatar-4 text-avatar-4-text",
  "bg-avatar-5 text-avatar-5-text",
  "bg-avatar-6 text-avatar-6-text",
] as const;

export type AvatarSize = "xs" | "sm" | "md" | "lg";

const SIZES: Readonly<Record<AvatarSize, string>> = {
  xs: "size-5 text-[0.6875rem]",
  sm: "size-7 text-caption",
  md: "size-9 text-body",
  lg: "size-12 text-h2",
};

export type AvatarProps = {
  readonly name: string;
  /** Постоянный ключ цвета — id участника. */
  readonly colorKey: string;
  readonly size?: AvatarSize;
  readonly className?: string;
};

/**
 * Круг с первой буквой имени. Декоративный: имя рядом показывается текстом,
 * поэтому сам круг скрыт от диктора.
 */
export function Avatar({ name, colorKey, size = "sm", className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        TONES[avatarToneIndex(colorKey)],
        SIZES[size],
        className,
      )}
    >
      {nameInitial(name)}
    </span>
  );
}
