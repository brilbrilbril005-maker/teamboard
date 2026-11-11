# Teamboard

Веб-приложение для управления задачами команды: задачи, ответственные, статусы, поиск и фильтры,
вход по логину и паролю. Тестовое задание.

> Статус: готов фундамент (архитектура, база, авторизация, тесты, развёртывание).
> Экраны задач и оформление — в работе.

## Стек

Next.js 16 · React 19 · TypeScript · Tailwind CSS · PostgreSQL · Drizzle ORM · Better Auth · Zod ·
Vitest · Playwright · Docker

Приложение не зависит от сторонних облачных сервисов: нужны только Node.js и PostgreSQL.

## Быстрый запуск (Docker)

```bash
cp .env.example .env        # заполнить AUTH_SECRET, POSTGRES_PASSWORD, APP_URL
docker compose up -d --build
```

Приложение откроется на `http://localhost:3000`. Миграции базы применяются автоматически при старте.

## Запуск без Docker

Нужны Node.js 22+ , pnpm и PostgreSQL.

```bash
pnpm install
cp .env.example .env.local  # заполнить DATABASE_URL, APP_URL, AUTH_SECRET
pnpm dev                    # разработка
# или боевой режим:
pnpm build && pnpm start
```

## Настройки

| Переменная       | Обязательна   | Описание                                                 |
| ---------------- | ------------- | -------------------------------------------------------- |
| `DATABASE_URL`   | да            | Строка подключения к PostgreSQL                          |
| `APP_URL`        | да            | Публичный адрес приложения (`https://…`)                 |
| `AUTH_SECRET`    | да            | Секрет сессий, от 32 символов: `openssl rand -base64 32` |
| `RUN_MIGRATIONS` | нет (`true`)  | Применять миграции при старте                            |
| `SEED_DEMO_DATA` | нет (`false`) | Заполнить пустую базу демо-данными                       |
| `DEMO_PASSWORD`  | нет           | Пароль демо-аккаунтов; включает кнопку «Войти как демо»  |

С неверными настройками сервер не запустится и напишет в журнал, что именно не так.

## Демо-доступ

При `SEED_DEMO_DATA=true` и заданном `DEMO_PASSWORD` в пустой базе создаются участники
`anna`, `olga`, `maxim`, `dmitry` (пароль — `DEMO_PASSWORD`) и набор задач.
На странице входа появляется кнопка «Войти как демо».

## Проверки

```bash
pnpm check      # типы, линтер, формат, тесты с покрытием
pnpm test:e2e   # сквозные тесты в браузере (нужна база teamboard_e2e)
```

Интеграционные тесты используют PostgreSQL в памяти (PGlite) и не требуют отдельной базы.

## Развёртывание на своём сервере

1. Собрать: `pnpm build` — получится самодостаточная папка `.next/standalone`.
2. Запустить: `node .next/standalone/server.js` с переменными окружения из таблицы выше
   (`PORT` и `HOSTNAME` — по необходимости).
3. Поставить перед приложением обратный прокси с HTTPS (nginx, Caddy), который дописывает адрес
   клиента в `X-Forwarded-For`, и не открывать порт приложения наружу напрямую.
4. Проверка работоспособности: `GET /api/health` → `200 {"status":"ok"}`.

Либо использовать готовые `Dockerfile` и `docker-compose.yml`.

## Устройство проекта

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — слои, данные, безопасность, тестирование
- [docs/DECISIONS.md](docs/DECISIONS.md) — принятые решения и их причины
- [docs/DEVLOG.md](docs/DEVLOG.md) — дневник разработки с ИИ
- [CLAUDE.md](CLAUDE.md) — правила проекта для ИИ-агентов
