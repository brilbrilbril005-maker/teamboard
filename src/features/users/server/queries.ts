import "server-only";
import { requireUser } from "@/features/auth/server/session";
import type { TeamMember } from "../model";
import { getUserRepository } from "./index";

/** Список участников команды. Доступен только вошедшим пользователям. */
export async function getTeamMembers(): Promise<TeamMember[]> {
  await requireUser();
  return getUserRepository().listTeamMembers();
}
