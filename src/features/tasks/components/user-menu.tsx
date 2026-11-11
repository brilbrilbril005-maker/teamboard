"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { ThemeMenuItem } from "@/components/ui/theme";
import { toast } from "@/components/ui/toast";
import { signOutAction } from "@/features/auth/server/actions";
import { useCloseOnHide } from "./use-close-on-hide";
import { useTeam } from "@/features/users/components/team-context";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/**
 * Меню пользователя в шапке: имя и @логин, «Тёмная тема», «Выйти».
 * compact — только аватар (мобильная шапка).
 */
export function UserMenu({ compact = false }: { readonly compact?: boolean }) {
  const { currentUser } = useTeam();
  const [open, setOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();
  useCloseOnHide(setOpen);

  const signOut = () => {
    startSignOut(async () => {
      // При успехе действие само переводит на страницу входа.
      const result = await signOutAction();
      if (result && !result.ok) {
        toast.error(result.error.message);
      }
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={`Меню пользователя ${currentUser.name}`}
        className={cn(
          "rounded-control hover:bg-surface-muted flex cursor-pointer items-center gap-2 transition-colors",
          compact ? "rounded-full p-0.5" : "h-11 px-2",
        )}
      >
        <Avatar name={currentUser.name} colorKey={currentUser.id} size="md" />
        {compact ? null : (
          <>
            <span className="text-body max-w-36 truncate font-medium">
              {firstName(currentUser.name)}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-muted size-4 transition-transform in-data-[state=open]:rotate-180"
            />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={currentUser.name} colorKey={currentUser.id} size="lg" />
          <div className="min-w-0">
            <p className="text-body truncate font-semibold">{currentUser.name}</p>
            <p className="text-muted truncate text-sm">@{currentUser.username}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="my-2" />
        <ThemeMenuItem />
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          icon={isSigningOut ? <Spinner /> : <LogOut aria-hidden="true" />}
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            signOut();
          }}
        >
          {isSigningOut ? "Выходим…" : "Выйти"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
