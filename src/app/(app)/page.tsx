import type { Metadata } from "next";
import { Suspense } from "react";
import { TaskWorkspace } from "@/features/tasks/components/task-workspace";
import { WorkspaceSkeleton } from "@/features/tasks/components/workspace-skeleton";
import { parseTaskView } from "@/features/tasks/components/workspace-url";
import { parseTaskFilters } from "@/features/tasks/schemas";
import { getTaskBoard } from "@/features/tasks/server/queries";

export const metadata: Metadata = { title: "Задачи команды" };

/**
 * Данные доски читаются по запросу (не кэшируются): фильтры и вид — из адреса,
 * «сегодня» — с сервера в часовом поясе команды (board.today).
 */
async function TaskWorkspaceLoader({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const params = await searchParams;
  const filters = parseTaskFilters(params);
  const board = await getTaskBoard(filters);

  return <TaskWorkspace board={board} filters={filters} view={parseTaskView(params)} />;
}

export default function TasksPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <TaskWorkspaceLoader searchParams={searchParams} />
    </Suspense>
  );
}
