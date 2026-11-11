"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardIllustration, EmptyState } from "@/components/ui/empty-state";
import { useTaskDialogs } from "./task-dialogs";

/** В команде ещё нет ни одной задачи. */
export function EmptyBoardState() {
  const { openCreate } = useTaskDialogs();
  return (
    <EmptyState
      className="rounded-card border-border bg-surface border py-16"
      illustration={<BoardIllustration />}
      title="Пока нет ни одной задачи"
      description="Создайте первую задачу для команды"
      action={
        <Button icon={<Plus aria-hidden="true" />} size="lg" onClick={() => openCreate()}>
          Создать задачу
        </Button>
      }
    />
  );
}

/** Задачи есть, но под выбранные фильтры не подходит ни одна. */
export function NoResultsState({ onReset }: { readonly onReset: () => void }) {
  return (
    <EmptyState
      className="rounded-card border-border bg-surface border py-16"
      illustration={<Search />}
      title="По вашему запросу ничего не найдено"
      description="Попробуйте изменить запрос или снять часть фильтров"
      action={
        <Button variant="secondary" size="lg" className="text-primary-text" onClick={onReset}>
          Сбросить фильтры
        </Button>
      }
    />
  );
}
