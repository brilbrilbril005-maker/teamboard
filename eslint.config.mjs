import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Помимо обычных проверок линтер охраняет границы между слоями (см. docs/ARCHITECTURE.md):
 *   интерфейс → действия/чтение → сервисы → репозитории → база.
 * Нарушение границы — ошибка сборки, а не замечание на ревью.
 */

const restrict = (patterns) => ["error", { patterns }];

// Папка server/ любого модуля: по сокращению "@/features/<модуль>/server" или по относительному пути.
const FEATURE_SERVER = "^(@/features/[^/]+|\\.{1,2}(/[^/]+)*)/server";

const DATABASE_MESSAGE =
  "К базе обращаются только репозитории (features/*/server/repository.ts) и папка src/db.";
const DATABASE = [
  { group: ["drizzle-orm", "drizzle-orm/*", "pg", "@electric-sql/*"], message: DATABASE_MESSAGE },
  // Папка src/db — по сокращению и по любому относительному пути.
  { regex: "^@/db(/|$)|^(\\.{1,2}/)+(.*/)?db(/|$)", message: DATABASE_MESSAGE },
];

// Интерфейсу из серверного кода доступны ровно три входа; всё остальное закрыто.
const UI_SERVER_ACCESS = {
  regex: `${FEATURE_SERVER}(?!/(actions|queries|session)$)(/.*)?$|^@/lib/server(/|$)`,
  message:
    "Интерфейс работает с сервером только через actions.ts (изменения), queries.ts (чтение) и session.ts.",
};
const ANY_SERVER_CODE = {
  regex: `${FEATURE_SERVER}(/.*)?$|^@/lib/server(/|$)|^server-only$`,
  message: "Этот файл общий для сервера и браузера — серверный код сюда импортировать нельзя.",
};
const FRAMEWORK = {
  group: ["next", "next/*", "react", "react-dom", "react-dom/*"],
  message:
    "Предметная логика не зависит от Next.js и React — так её можно проверять обычными тестами.",
};
const NEXT_RUNTIME = {
  group: ["next", "next/*", "react", "react-dom", "react-dom/*"],
  message: "Сервисы и репозитории не знают про Next.js и React: запрос и cookie им передают явно.",
};
// Зависимости идут только вниз: действия → сервис → репозиторий.
const ABOVE_SERVICE = {
  regex:
    "/server/(actions|queries|session|authed-action)$|^\\./(actions|queries|session|authed-action)$",
  message:
    "Сервис не зависит от слоя выше (действия, чтение, сессия): пользователя ему передают аргументом.",
};
const ABOVE_REPOSITORY = {
  regex:
    "/server/(service|actions|queries|session|authed-action|index)$|^\\./(service|actions|queries|session|authed-action|index)$",
  message: "Репозиторий — нижний слой: он не зависит от сервисов и действий.",
};
const REPOSITORY_DIRECTLY = {
  regex: "/server/repository$|^\\./repository$",
  message:
    "Действия и чтение получают сервис или репозиторий из server/index.ts, а не создают их сами.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx,mts}"],
    rules: {
      "no-console": "error",
      eqeqeq: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Журнал — единственное место, где разрешён console; скрипты пишут в терминал.
    files: ["src/lib/server/logger.ts", "scripts/**"],
    rules: { "no-console": "off" },
  },

  // --- Границы слоёв -------------------------------------------------------
  // Блоки идут от общего к частному: для файла действует последний подходящий.
  {
    // По умолчанию весь код приложения отрезан от базы.
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": restrict([...DATABASE]) },
  },
  {
    // Чистая предметная часть: файлы верхнего уровня модуля (model, schemas, policy, …) и src/lib.
    files: ["src/features/*/*.ts", "src/lib/*.ts"],
    rules: { "no-restricted-imports": restrict([...DATABASE, ANY_SERVER_CODE, FRAMEWORK]) },
  },
  {
    // Интерфейс: страницы, компоненты, хуки.
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/features/*/components/**/*.{ts,tsx}",
      "src/features/*/hooks/**/*.{ts,tsx}",
    ],
    rules: { "no-restricted-imports": restrict([...DATABASE, UI_SERVER_ACCESS]) },
  },
  {
    // Сервисы: правила и сценарии. Без базы, без Next.js, без слоя выше.
    files: ["src/features/*/server/service.ts"],
    rules: { "no-restricted-imports": restrict([...DATABASE, NEXT_RUNTIME, ABOVE_SERVICE]) },
  },
  {
    // Репозитории: только доступ к данным.
    files: ["src/features/*/server/repository.ts"],
    rules: { "no-restricted-imports": restrict([NEXT_RUNTIME, ABOVE_REPOSITORY]) },
  },
  {
    // Действия и чтение: связывают Next.js с сервисами.
    files: ["src/features/*/server/{actions,queries}.ts"],
    rules: { "no-restricted-imports": restrict([...DATABASE, REPOSITORY_DIRECTLY]) },
  },
  {
    // Места, где зависимости собираются вместе или где работа с базой — сама суть файла.
    files: [
      "src/db/**/*.ts",
      "src/instrumentation.ts",
      "src/features/*/server/index.ts",
      "src/features/auth/server/auth.ts",
      "src/lib/server/rate-limit.ts",
      "src/app/api/health/route.ts",
    ],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Тесты могут собирать зависимости напрямую (база в памяти и т. п.).
    files: ["**/*.test.{ts,tsx}", "tests/**"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Фикстуры Playwright используют параметр `use` и пустую деструктуризацию — это не хуки React.
    files: ["tests/e2e/**"],
    rules: { "react-hooks/rules-of-hooks": "off", "no-empty-pattern": "off" },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "drizzle/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
