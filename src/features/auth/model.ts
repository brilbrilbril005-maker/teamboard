import type { TeamMember } from "@/features/users/model";

/** Пользователь текущей сессии. Никаких секретов: только то, что нужно интерфейсу. */
export type CurrentUser = TeamMember;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const DISPLAY_NAME_MAX_LENGTH = 50;

/** Логин демо-аккаунта для кнопки «Войти как демо». */
export const DEMO_USERNAME = "anna";

/** Логины не чувствительны к регистру: храним и сравниваем в нижнем регистре. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
