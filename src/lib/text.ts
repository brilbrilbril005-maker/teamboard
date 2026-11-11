const NUL = "\u0000";

/**
 * PostgreSQL не хранит нулевой символ в тексте и отвечает на него ошибкой.
 * Проверяем заранее, чтобы пользователь получил понятное сообщение, а не «что-то пошло не так».
 */
export function hasNoNulCharacter(value: string): boolean {
  return !value.includes(NUL);
}

export function stripNulCharacters(value: string): string {
  return value.replaceAll(NUL, "");
}

export const INVALID_CHARACTERS_MESSAGE = "Текст содержит недопустимые символы";
