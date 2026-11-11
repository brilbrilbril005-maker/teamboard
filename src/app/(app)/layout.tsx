import { Suspense } from "react";
import { requireUser } from "@/features/auth/server/session";
import { SaveStatusProvider } from "@/features/tasks/components/save-status";
import { TaskDialogsProvider } from "@/features/tasks/components/task-dialogs";
import { WorkspaceSkeleton } from "@/features/tasks/components/workspace-skeleton";
import { TeamProvider } from "@/features/users/components/team-context";
import { getTeamMembers } from "@/features/users/server/queries";

/**
 * Оболочка приложения для вошедших: кто вошёл, участники команды, окна задач
 * и индикатор сохранения. Сессия читается внутри <Suspense> — этого требует Cache Components;
 * без входа requireUser() отправит на страницу входа.
 */
async function AppShell({ children }: { readonly children: React.ReactNode }) {
  const [currentUser, members] = await Promise.all([requireUser(), getTeamMembers()]);

  return (
    <TeamProvider currentUser={currentUser} members={members}>
      <TaskDialogsProvider currentUser={currentUser} members={members}>
        {children}
      </TaskDialogsProvider>
    </TeamProvider>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SaveStatusProvider>
      <Suspense fallback={<WorkspaceSkeleton />}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </SaveStatusProvider>
  );
}
