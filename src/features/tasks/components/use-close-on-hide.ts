"use client";

import { useLayoutEffect } from "react";

/**
 * Next.js не удаляет ушедшую страницу, а прячет её (<Activity>) вместе с состоянием.
 * Открытые меню и окна при возврате на страницу открытыми быть не должны —
 * закрываем их в момент скрытия. setOpen должен быть стабильным (сеттер useState).
 */
export function useCloseOnHide(setOpen: (open: false) => void): void {
  useLayoutEffect(() => () => setOpen(false), [setOpen]);
}
