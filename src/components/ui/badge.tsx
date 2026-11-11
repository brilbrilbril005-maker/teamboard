import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

const TONES: Readonly<Record<BadgeTone, string>> = {
  neutral: "bg-surface-muted text-foreground",
  primary: "bg-primary-soft text-primary-text",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
};

const SIZES: Readonly<Record<BadgeSize, string>> = {
  sm: "h-6 gap-1.5 px-2 text-caption [&_svg]:size-3.5",
  md: "h-8 gap-2 px-3 text-sm [&_svg]:size-4",
};

export type BadgeProps = ComponentProps<"span"> & {
  readonly tone?: BadgeTone;
  readonly size?: BadgeSize;
  readonly icon?: ReactNode;
};

/** Плашка с текстом: статус, приоритет, дедлайн. Только для показа, не кнопка. */
export function Badge({
  tone = "neutral",
  size = "sm",
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center rounded-md font-medium whitespace-nowrap [&_svg]:shrink-0",
        TONES[tone],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

/** Цветная точка (приоритет). Цвет — через className: bg-priority-high и т. п. */
export function Dot({ className }: { readonly className?: string }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", className)} />;
}
