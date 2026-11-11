import { UserRound } from "lucide-react";
import { Avatar, type AvatarSize } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { shortName } from "@/lib/names";
import type { TeamMember } from "../model";

export const UNASSIGNED_LABEL = "Не назначен";

export type MemberAvatarProps = {
  /** null — ответственный не назначен. */
  readonly member: Pick<TeamMember, "id" | "name"> | null;
  readonly size?: AvatarSize;
  /** short — «Анна С.» (карточки, списки), full — «Анна Смирнова», none — только кружок. */
  readonly nameDisplay?: "short" | "full" | "none";
  readonly className?: string;
};

/** Участник: цветной кружок с буквой и имя рядом. Цвет постоянный — по id. */
export function MemberAvatar({
  member,
  size = "sm",
  nameDisplay = "short",
  className,
}: MemberAvatarProps) {
  if (!member) {
    return (
      <span className={cn("text-muted inline-flex min-w-0 items-center gap-2", className)}>
        <UserRound aria-hidden="true" className="size-5 shrink-0" />
        {nameDisplay === "none" ? (
          <span className="sr-only">{UNASSIGNED_LABEL}</span>
        ) : (
          <span className="truncate">{UNASSIGNED_LABEL}</span>
        )}
      </span>
    );
  }

  const label = nameDisplay === "full" ? member.name : shortName(member.name);

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <Avatar name={member.name} colorKey={member.id} size={size} />
      {nameDisplay === "none" ? (
        <span className="sr-only">{member.name}</span>
      ) : (
        <span className="truncate" title={label === member.name ? undefined : member.name}>
          {label}
        </span>
      )}
    </span>
  );
}
