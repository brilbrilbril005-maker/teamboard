"use client";

import { LogOut } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import type { ActionResult } from "@/lib/result";
import { signInAsDemoAction, signOutAction } from "../server/actions";

type ActionButtonProps = {
  readonly action: () => Promise<ActionResult<unknown>>;
  readonly label: string;
  readonly pendingLabel: string;
  readonly variant?: ButtonProps["variant"];
  readonly size?: ButtonProps["size"];
  readonly icon?: ReactNode;
  readonly className?: string;
};

function ActionButton({
  action,
  label,
  pendingLabel,
  variant = "secondary",
  size = "md",
  icon,
  className,
}: ActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? null : result.error.message);
    });
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        onClick={handleClick}
        loading={isPending}
        loadingText={pendingLabel}
        className="w-full"
      >
        {label}
      </Button>
      {message ? (
        <p role="alert" className="text-caption text-danger-text text-center">
          {message}
        </p>
      ) : null}
    </div>
  );
}

/** «Войти как демо-пользователь». Показывать, только если демо-вход включён на сервере. */
export function DemoSignInButton({ className }: { readonly className?: string }) {
  return (
    <ActionButton
      action={signInAsDemoAction}
      label="Войти как демо-пользователь"
      pendingLabel="Входим…"
      size="lg"
      className={className}
    />
  );
}

export function SignOutButton({ className }: { readonly className?: string }) {
  return (
    <ActionButton
      action={signOutAction}
      label="Выйти"
      pendingLabel="Выходим…"
      icon={<LogOut aria-hidden="true" />}
      className={className}
    />
  );
}
