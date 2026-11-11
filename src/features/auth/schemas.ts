import { z } from "zod";
import { hasNoNulCharacter, INVALID_CHARACTERS_MESSAGE } from "@/lib/text";
import {
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  normalizeUsername,
} from "./model";

// Пустое поле — «Введите логин», как при входе; правила длины показываем, только когда
// что-то уже введено. abort — чтобы под пустым полем не копились лишние ошибки.
const USERNAME_REQUIRED = { message: "Введите логин", abort: true } as const;
const PASSWORD_REQUIRED = { message: "Введите пароль", abort: true } as const;

/** Правила для нового логина: латиница, цифры и «_», 3–20 символов. */
export const usernameSchema = z
  .string()
  .trim()
  .min(1, USERNAME_REQUIRED)
  .min(USERNAME_MIN_LENGTH, `Логин — не короче ${USERNAME_MIN_LENGTH} символов`)
  .max(USERNAME_MAX_LENGTH, `Логин — не длиннее ${USERNAME_MAX_LENGTH} символов`)
  .regex(USERNAME_PATTERN, "Только латинские буквы, цифры и знак «_»")
  .transform(normalizeUsername);

export const passwordSchema = z
  .string()
  .min(1, PASSWORD_REQUIRED)
  .min(PASSWORD_MIN_LENGTH, `Пароль — не короче ${PASSWORD_MIN_LENGTH} символов`)
  .max(PASSWORD_MAX_LENGTH, `Пароль — не длиннее ${PASSWORD_MAX_LENGTH} символов`);

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Укажите имя")
  .refine(hasNoNulCharacter, INVALID_CHARACTERS_MESSAGE)
  .max(DISPLAY_NAME_MAX_LENGTH, `Имя — не длиннее ${DISPLAY_NAME_MAX_LENGTH} символов`);

export const signUpSchema = z.object({
  username: usernameSchema,
  name: displayNameSchema,
  password: passwordSchema,
});

/**
 * При входе не подсказываем правила логина и пароля:
 * проверяем только, что поля заполнены и не превышают разумный размер.
 */
export const signInSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, USERNAME_REQUIRED)
    .max(USERNAME_MAX_LENGTH, "Неверный логин или пароль")
    .transform(normalizeUsername),
  password: z
    .string()
    .min(1, PASSWORD_REQUIRED)
    .max(PASSWORD_MAX_LENGTH, "Неверный логин или пароль"),
});

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpData = z.output<typeof signUpSchema>;
export type SignInInput = z.input<typeof signInSchema>;
export type SignInData = z.output<typeof signInSchema>;
