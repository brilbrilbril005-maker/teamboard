import "server-only";
import { headers } from "next/headers";

/** Сведения о текущем запросе, которые нужны сервисам (но не сам запрос Next.js). */
export type RequestContext = {
  readonly headers: Headers;
  readonly clientIp: string;
};

const UNKNOWN_IP = "unknown";

/**
 * IP клиента по заголовкам обратного прокси. Используется только как часть
 * ключа ограничителя попыток, решений о доступе по нему не принимается.
 */
export function getClientIp(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || requestHeaders.get("x-real-ip")?.trim() || UNKNOWN_IP;
}

export async function getRequestContext(): Promise<RequestContext> {
  const requestHeaders = await headers();
  return { headers: requestHeaders, clientIp: getClientIp(requestHeaders) };
}
