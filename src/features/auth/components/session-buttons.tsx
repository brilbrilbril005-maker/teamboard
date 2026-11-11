"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/result";
import { signInAsDemoAction, signOutAction } from "../server/actions";

function ActionButton({
  action,
  label,
  pendingLabel,
}: {
  action: () => Promise<ActionResult<unknown>>;
  label: string;
  pendingLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? null : result.error.message);
    });
  };

  return (
    <>
      <button type="button" onClick={handleClick} disabled={isPending} className="border p-2">
        {isPending ? pendingLabel : label}
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </>
  );
}

export function DemoSignInButton() {
  return <ActionButton action={signInAsDemoAction} label="Войти как демо" pendingLabel="Входим…" />;
}

export function SignOutButton() {
  return <ActionButton action={signOutAction} label="Выйти" pendingLabel="Выходим…" />;
}
