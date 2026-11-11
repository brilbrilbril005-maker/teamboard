import { randomUUID } from "node:crypto";
import { test as base, expect } from "@playwright/test";

/**
 * У каждого теста свой «адрес клиента». Ограничитель попыток считает
 * регистрации и входы по адресу, и без этого тесты мешали бы друг другу.
 */
function uniqueClientIp(): string {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  return `10.${octet()}.${octet()}.${octet()}`;
}

export const test = base.extend({
  extraHTTPHeaders: async ({}, use) => {
    await use({ "x-forwarded-for": uniqueClientIp() });
  },
});

/** Уникальный логин, подходящий под правила (латиница, цифры, «_», до 20 символов). */
export function uniqueUsername(prefix = "user"): string {
  return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

export { expect };
