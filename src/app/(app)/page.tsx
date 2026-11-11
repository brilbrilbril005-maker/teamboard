import { Suspense } from "react";
import { SignOutButton } from "@/features/auth/components/session-buttons";
import { requireUser } from "@/features/auth/server/session";
import { getTeamMembers } from "@/features/users/server/queries";

/**
 * Временная главная страница: показывает, что вход работает и данные
 * читаются из базы через все слои. Доска задач появится здесь позже.
 */
async function Workspace() {
  const user = await requireUser();
  const teamMembers = await getTeamMembers();

  return (
    <>
      <p>
        Вы вошли как <strong>{user.name}</strong> (@{user.username})
      </p>
      <h2 className="font-semibold">Команда</h2>
      <ul className="list-disc pl-5">
        {teamMembers.map((member) => (
          <li key={member.id}>
            {member.name} (@{member.username})
          </li>
        ))}
      </ul>
      <SignOutButton />
    </>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Teamboard</h1>
      <Suspense fallback={<p>Загрузка…</p>}>
        <Workspace />
      </Suspense>
    </main>
  );
}
