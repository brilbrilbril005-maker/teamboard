import "server-only";
import { asc, count, eq, isNotNull } from "drizzle-orm";
import { users } from "@/db/schema";
import type { Database } from "@/db/types";
import type { TeamMember } from "../model";

/** Наружу отдаём только публичные поля — ни почты, ни служебных данных. */
const teamMemberColumns = {
  id: users.id,
  name: users.name,
  username: users.username,
};

type TeamMemberRow = { id: string; name: string; username: string | null };

function toTeamMember(row: TeamMemberRow): TeamMember {
  return { id: row.id, name: row.name, username: row.username ?? "" };
}

export function createUserRepository(db: Database) {
  return {
    async listTeamMembers(): Promise<TeamMember[]> {
      const rows = await db
        .select(teamMemberColumns)
        .from(users)
        .where(isNotNull(users.username))
        .orderBy(asc(users.name), asc(users.id));
      return rows.map(toTeamMember);
    },

    async findTeamMemberById(id: string): Promise<TeamMember | null> {
      const [row] = await db.select(teamMemberColumns).from(users).where(eq(users.id, id)).limit(1);
      return row ? toTeamMember(row) : null;
    },

    async countUsers(): Promise<number> {
      const [row] = await db.select({ value: count() }).from(users);
      return row?.value ?? 0;
    },
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
