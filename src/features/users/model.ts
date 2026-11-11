/** Участник команды — то, что о пользователе можно показывать другим. */
export type TeamMember = {
  readonly id: string;
  readonly username: string;
  readonly name: string;
};
