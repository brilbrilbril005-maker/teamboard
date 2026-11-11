"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CurrentUser } from "@/features/auth/model";
import type { TeamMember } from "../model";

/**
 * Кто вошёл и кто в команде. Сервер читает это один раз в оболочке приложения
 * ((app)/layout.tsx), а меню, фильтры и боковая панель берут отсюда.
 */
export type TeamContextValue = {
  readonly currentUser: CurrentUser;
  readonly members: readonly TeamMember[];
};

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({
  currentUser,
  members,
  children,
}: TeamContextValue & { readonly children: ReactNode }) {
  const value = useMemo(() => ({ currentUser, members }), [currentUser, members]);
  return <TeamContext value={value}>{children}</TeamContext>;
}

export function useTeam(): TeamContextValue {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("TeamProvider не подключён");
  }
  return context;
}
