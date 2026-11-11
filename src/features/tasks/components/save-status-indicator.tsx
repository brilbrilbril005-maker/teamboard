"use client";

import { Check, CircleAlert } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { Spinner } from "@/components/ui/spinner";
import { useSaveStatus, type SaveState } from "./save-status";

const LABELS: Readonly<Record<"full" | "compact", Readonly<Record<SaveState, string>>>> = {
  full: {
    saved: "Все изменения сохранены",
    saving: "Сохранение…",
    error: "Не удалось сохранить",
  },
  compact: { saved: "Сохранено", saving: "Сохранение…", error: "Не сохранено" },
};

/** «✓ Все изменения сохранены» в шапке; compact — «✓ Сохранено» внизу мобильного экрана. */
export function SaveStatusIndicator({
  variant = "full",
  className,
}: {
  readonly variant?: "full" | "compact";
  readonly className?: string;
}) {
  const state = useSaveStatus();

  return (
    <p
      role="status"
      className={cn(
        "text-muted inline-flex items-center gap-2 text-sm whitespace-nowrap",
        state === "error" && "text-danger-text",
        className,
      )}
    >
      {state === "saving" ? <Spinner className="size-4" /> : null}
      {state === "saved" ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
      {state === "error" ? <CircleAlert aria-hidden="true" className="size-4 shrink-0" /> : null}
      {LABELS[variant][state]}
    </p>
  );
}
