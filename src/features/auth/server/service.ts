import "server-only";
import { isAPIError } from "better-auth/api";
import { AppError, ConflictError, ValidationError } from "@/lib/errors";
import type { RateLimiter, RateLimitRule } from "@/lib/server/rate-limit";
import type { RequestContext } from "@/lib/server/request";
import { DEMO_USERNAME, type CurrentUser } from "../model";
import type { SignInData, SignUpData } from "../schemas";
import type { Auth } from "./auth";

const TEN_MINUTES_IN_SECONDS = 10 * 60;

/** Не больше 10 попыток входа за 10 минут для пары «адрес + логин». */
export const SIGN_IN_RATE_LIMIT: RateLimitRule = { limit: 10, windowSeconds: TEN_MINUTES_IN_SECONDS };
/**
 * Общий потолок попыток на один логин с любых адресов. Адрес клиента берётся
 * из заголовка прокси и может быть подделан, поэтому подбор пароля
 * ограничен ещё и независимо от адреса.
 */
export const SIGN_IN_PER_USERNAME_RATE_LIMIT: RateLimitRule = { limit: 30, windowSeconds: TEN_MINUTES_IN_SECONDS };
/** Не больше 20 демо-входов за 10 минут с одного адреса. */
export const DEMO_SIGN_IN_RATE_LIMIT: RateLimitRule = { limit: 20, windowSeconds: TEN_MINUTES_IN_SECONDS };
/** Не больше 5 регистраций в час с одного адреса. */
export const SIGN_UP_RATE_LIMIT: RateLimitRule = { limit: 5, windowSeconds: 60 * 60 };

const INVALID_CREDENTIALS_MESSAGE = "Неверный логин или пароль";
const USERNAME_TAKEN_MESSAGE = "Этот логин уже занят";
const DEMO_DISABLED_MESSAGE = "Демо-вход сейчас недоступен";

const USERNAME_TAKEN_CODES: readonly string[] = [
  "USERNAME_IS_ALREADY_TAKEN",
  "USER_ALREADY_EXISTS",
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
];
const INVALID_CREDENTIALS_CODES: readonly string[] = [
  "INVALID_USERNAME_OR_PASSWORD",
  "INVALID_EMAIL_OR_PASSWORD",
];

/**
 * Почту мы не собираем, но библиотеке авторизации нужно уникальное поле email.
 * Домен .invalid зарезервирован стандартом: письмо на него уйти не может.
 */
export function toInternalEmail(username: string): string {
  return `${username}@users.teamboard.invalid`;
}

type AuthUser = { id: string; name: string; username?: string | null };

function toCurrentUser(user: AuthUser, fallbackUsername = ""): CurrentUser {
  return { id: user.id, name: user.name, username: user.username ?? fallbackUsername };
}

function getApiErrorCode(error: unknown): string | undefined {
  if (!isAPIError(error)) {
    return undefined;
  }
  const code: unknown = (error.body as { code?: unknown } | undefined)?.code;
  return typeof code === "string" ? code : undefined;
}

/** Переводит ошибки библиотеки в ошибки приложения с русским текстом. */
function translateAuthError(error: unknown): unknown {
  if (error instanceof AppError) {
    return error;
  }
  const code = getApiErrorCode(error);
  if (code && USERNAME_TAKEN_CODES.includes(code)) {
    return new ConflictError(USERNAME_TAKEN_MESSAGE, { username: [USERNAME_TAKEN_MESSAGE] });
  }
  if (code && INVALID_CREDENTIALS_CODES.includes(code)) {
    return new ValidationError(INVALID_CREDENTIALS_MESSAGE);
  }
  return error;
}

export type AuthServiceDeps = {
  readonly auth: Auth;
  readonly rateLimiter: RateLimiter;
  /** Пароль демо-аккаунта. Без него вход «как демо» выключен. */
  readonly demoPassword?: string | undefined;
};

export function createAuthService({ auth, rateLimiter, demoPassword }: AuthServiceDeps) {
  /** Проверка логина и пароля без ограничителя попыток. */
  async function authenticate(credentials: SignInData, request: RequestContext): Promise<CurrentUser> {
    try {
      const result = await auth.api.signInUsername({
        body: { username: credentials.username, password: credentials.password },
        headers: request.headers,
      });
      if (!result) {
        throw new ValidationError(INVALID_CREDENTIALS_MESSAGE);
      }
      return toCurrentUser(result.user, credentials.username);
    } catch (error) {
      throw translateAuthError(error);
    }
  }

  async function signIn(credentials: SignInData, request: RequestContext): Promise<CurrentUser> {
    const perClientKey = `sign-in:${request.clientIp}:${credentials.username}`;
    await rateLimiter.consume(`sign-in:any:${credentials.username}`, SIGN_IN_PER_USERNAME_RATE_LIMIT);
    await rateLimiter.consume(perClientKey, SIGN_IN_RATE_LIMIT);

    const user = await authenticate(credentials, request);
    // Счётчик адреса сбрасываем после успеха; общий счётчик логина — нет,
    // иначе свой удачный вход обнулял бы защиту от подбора чужого пароля.
    await rateLimiter.reset(perClientKey);
    return user;
  }

  return {
    signIn,

    async signUp(data: SignUpData, request: RequestContext): Promise<CurrentUser> {
      await rateLimiter.consume(`sign-up:${request.clientIp}`, SIGN_UP_RATE_LIMIT);
      try {
        const result = await auth.api.signUpEmail({
          body: {
            email: toInternalEmail(data.username),
            username: data.username,
            name: data.name,
            password: data.password,
          },
          headers: request.headers,
        });
        return toCurrentUser(result.user, data.username);
      } catch (error) {
        throw translateAuthError(error);
      }
    },

    /** Вход проверяющего одним нажатием. Пароль берётся из настроек сервера, а не от клиента. */
    async signInAsDemo(request: RequestContext): Promise<CurrentUser> {
      if (!demoPassword) {
        throw new ValidationError(DEMO_DISABLED_MESSAGE);
      }
      // Пароль не приходит от клиента, подбирать нечего — поэтому демо-вход
      // не зависит от счётчика неудачных попыток по логину и его нельзя «заблокировать».
      await rateLimiter.consume(`demo-sign-in:${request.clientIp}`, DEMO_SIGN_IN_RATE_LIMIT);
      return authenticate({ username: DEMO_USERNAME, password: demoPassword }, request);
    },

    async signOut(request: RequestContext): Promise<void> {
      await auth.api.signOut({ headers: request.headers });
    },

    async getCurrentUser(requestHeaders: Headers): Promise<CurrentUser | null> {
      const session = await auth.api.getSession({ headers: requestHeaders });
      return session ? toCurrentUser(session.user) : null;
    },

    isDemoEnabled(): boolean {
      return Boolean(demoPassword);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
