import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/components/ui/cn";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "../model";
import { StatusIcon, taskStatusBackground } from "./badges";
import { WORKSPACE_CONTENT_CLASS_NAME, WORKSPACE_SIDEBAR_CLASS_NAME } from "./workspace-layout";

const CARDS_PER_COLUMN = 2;

function CardSkeleton() {
  return (
    <div className="rounded-card border-border bg-surface flex flex-col gap-2.5 border p-4">
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
      <Skeleton className="h-5 w-1/3" />
      <div className="flex items-center gap-2">
        <Skeleton className="size-7 rounded-full" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/**
 * Загрузка страницы задач (лист 07): каркас страницы, колонки со скелетонами карточек
 * и «Загрузка…» рядом с заголовком. Серверный компонент — подходит для fallback <Suspense>.
 */
export function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="lg:pl-68">
      <div className={WORKSPACE_SIDEBAR_CLASS_NAME}>
        <Logo className="px-3" />
        <div className="mt-8 flex flex-col gap-3 px-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-3/4" />
        </div>
        <div className="mt-8 flex flex-col gap-4 px-3">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className={WORKSPACE_CONTENT_CLASS_NAME}>
        <div className="flex items-center gap-4 py-3 md:py-6">
          <Logo size="sm" className="md:hidden" />
          <h1 className="text-h2 md:text-h1 hidden md:block">Задачи команды</h1>
          <Spinner className="text-primary size-5" />
          <p role="status" className="text-muted text-sm">
            Загрузка…
          </p>
        </div>
        <div className="mb-6 hidden gap-3 md:flex">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((status, index) => (
            <div
              key={status}
              className={cn(
                "rounded-card bg-surface-muted/60 flex-col",
                index === 0 ? "flex" : "hidden md:flex",
              )}
            >
              <div
                className={cn(
                  "rounded-t-card flex items-center gap-2.5 px-4 py-3.5 text-lg font-semibold",
                  taskStatusBackground(status),
                )}
              >
                <StatusIcon status={status} className="size-6" />
                {TASK_STATUS_LABELS[status]}
              </div>
              <div className="flex flex-col gap-3 p-3">
                {Array.from({ length: CARDS_PER_COLUMN }, (_, card) => (
                  <CardSkeleton key={card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
