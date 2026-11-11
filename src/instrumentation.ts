/**
 * Выполняется один раз при старте сервера, до приёма запросов.
 * Если настройки неверны или база недоступна — сервер не запустится,
 * и причина будет видна в журнале сразу, а не при первом запросе пользователя.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { prepareDatabase } = await import("@/db/bootstrap");
  await prepareDatabase();
}
