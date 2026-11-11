import "server-only";
import { isIP } from "node:net";
import { headers } from "next/headers";

/** Сведения о текущем запросе, которые нужны сервисам (но не сам запрос Next.js). */
export type RequestContext = {
  readonly headers: Headers;
  readonly clientIp: string;
};

const UNKNOWN_IP = "unknown";

function toValidIp(value: string | null | undefined): string | undefined {
  const candidate = value?.trim();
  return candidate && isIP(candidate) !== 0 ? candidate : undefined;
}

/**
 * IP клиента по заголовкам обратного прокси. Используется только как часть
 * ключа ограничителя попыток, решений о доступе по нему не принимается.
 *
 * Из X-Forwarded-For берётся ПОСЛЕДНИЙ адрес: его дописывает наш прокси, а всё,
 * что левее, присылает сам клиент и может быть подделано. Значение, не похожее
 * на IP-адрес, отбрасывается — в ключ счётчика не попадёт произвольная строка.
 */
export function getClientIp(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",").at(-1);
  return toValidIp(forwardedFor) ?? toValidIp(requestHeaders.get("x-real-ip")) ?? UNKNOWN_IP;
}

export async function getRequestContext(): Promise<RequestContext> {
  const requestHeaders = await headers();
  return { headers: requestHeaders, clientIp: getClientIp(requestHeaders) };
}
