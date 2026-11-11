"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CurrentUser } from "@/features/auth/model";
import type { TeamMember } from "@/features/users/model";
import { todayIso, type IsoDate } from "@/lib/dates";
import type { Task, TaskStatus } from "../model";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { TaskFormDialog } from "./task-form-dialog";

/**
 * Окна создания, редактирования и удаления задачи.
 *
 * КОНТРАКТ между частями интерфейса: страница оборачивает содержимое в
 * <TaskDialogsProvider> (внутри <SaveStatusProvider>), а доска, список и меню
 * карточки открывают окна только через useTaskDialogs(). Сигнатуры ниже не менять.
 */
export type TaskDialogsApi = {
  /** Открыть окно «Новая задача»; status — колонка, из которой нажали «Создать». */
  readonly openCreate: (defaults?: { readonly status?: TaskStatus }) => void;
  readonly openEdit: (task: Task) => void;
  /** Подтверждение удаления. Вызывать только если canDeleteTask(user, task). */
  readonly openDelete: (task: Task) => void;
};

export type TaskDialogsProviderProps = {
  readonly members: readonly TeamMember[];
  readonly currentUser: CurrentUser;
  readonly children: ReactNode;
};

type DialogState =
  | { readonly kind: "closed" }
  | { readonly kind: "create"; readonly key: number; readonly status?: TaskStatus }
  | { readonly kind: "edit"; readonly key: number; readonly task: Task; readonly today: IsoDate }
  | { readonly kind: "delete"; readonly key: number; readonly task: Task };

const CLOSED: DialogState = { kind: "closed" };

const TaskDialogsContext = createContext<TaskDialogsApi | null>(null);

/**
 * Куда вернуть фокус после закрытия окна. Если окно открыли пунктом меню «⋯»,
 * сам пункт исчезнет вместе с меню — тогда возвращаемся на кнопку, открывшую меню.
 */
function findReturnFocusTarget(): HTMLElement | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) {
    return null;
  }
  const menu = active.closest<HTMLElement>('[role="menu"]');
  if (menu?.id) {
    const trigger = document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(menu.id)}"]`);
    if (trigger) {
      return trigger;
    }
  }
  return active;
}

export function TaskDialogsProvider({ members, currentUser, children }: TaskDialogsProviderProps) {
  const [dialog, setDialog] = useState<DialogState>(CLOSED);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const keyRef = useRef(0);

  const api = useMemo<TaskDialogsApi>(() => {
    const open = (next: (key: number) => DialogState) => {
      returnFocusRef.current = findReturnFocusTarget();
      keyRef.current += 1;
      setDialog(next(keyRef.current));
    };
    return {
      openCreate: (defaults) => open((key) => ({ kind: "create", key, status: defaults?.status })),
      // «Сегодня» считаем в момент открытия, а не при отрисовке: так не нужен new Date() в рендере.
      openEdit: (task) => open((key) => ({ kind: "edit", key, task, today: todayIso() })),
      openDelete: (task) => open((key) => ({ kind: "delete", key, task })),
    };
  }, []);

  // Next.js прячет ушедшую страницу через <Activity>, а не удаляет её. Закрываем окна,
  // чтобы при возвращении на страницу не всплыло забытое полузаполненное окно.
  useLayoutEffect(() => () => setDialog(CLOSED), []);

  const close = () => setDialog(CLOSED);

  const restoreFocus = (event: Event) => {
    const target = returnFocusRef.current;
    if (target?.isConnected) {
      event.preventDefault();
      target.focus();
    }
  };

  // У подтверждения нет своего обработчика закрытия — возвращаем фокус после его собственного.
  const closeDelete = () => {
    const target = returnFocusRef.current;
    close();
    window.setTimeout(() => {
      const active = document.activeElement;
      const focusLost = active === null || active === document.body;
      if (target?.isConnected && focusLost) {
        target.focus();
      }
    }, 0);
  };

  return (
    <TaskDialogsContext value={api}>
      {children}
      {dialog.kind === "create" || dialog.kind === "edit" ? (
        <TaskFormDialog
          key={dialog.key}
          mode={dialog}
          members={members}
          currentUser={currentUser}
          onClose={close}
          onCloseAutoFocus={restoreFocus}
        />
      ) : null}
      {dialog.kind === "delete" ? (
        <DeleteTaskDialog key={dialog.key} task={dialog.task} onClose={closeDelete} />
      ) : null}
    </TaskDialogsContext>
  );
}

export function useTaskDialogs(): TaskDialogsApi {
  const context = useContext(TaskDialogsContext);
  if (!context) {
    throw new Error("TaskDialogsProvider не подключён");
  }
  return context;
}
