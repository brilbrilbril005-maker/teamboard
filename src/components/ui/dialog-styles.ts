/**
 * Окно на компьютере и нижняя шторка на телефоне — одни и те же классы:
 * до 640px окно прижато к низу экрана со скруглением сверху, шире — по центру.
 */
export const DIALOG_OVERLAY_CLASS_NAME = "animate-fade-in fixed inset-0 z-50 bg-overlay";

const SHEET = "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-dialog animate-sheet-in";
const CENTERED =
  "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[min(90dvh,48rem)] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-dialog sm:animate-pop-in";

export type DialogLayout = "responsive" | "sheet";
export type DialogSize = "sm" | "md" | "lg";

export const DIALOG_SIZE_CLASS_NAME: Readonly<Record<DialogSize, string>> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-xl",
};

export function dialogPanelClassName(layout: DialogLayout): string {
  return [
    "fixed z-50 flex flex-col overflow-y-auto overscroll-contain bg-surface text-foreground shadow-popover outline-none",
    "px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6",
    SHEET,
    layout === "responsive" ? CENTERED : "sm:mx-auto sm:max-w-lg",
  ].join(" ");
}
