import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Помимо обычных проверок линтер охраняет границы между слоями (см. docs/ARCHITECTURE.md):
 *   интерфейс → действия/чтение → сервисы → репозитории → база.
 * Нарушение границы — ошибка сборки, а не замечание на ревью.
 */

const restrict = (patterns) => ["error", { patterns }];

const DATABASE = {
  group: ["drizzle-orm", "drizzle-orm/*", "pg", "@electric-sql/*", "@/db/*", "@/db/**"],
  message: "К базе обращаются только репозитории (features/*/server/repository.ts) и папка src/db.",
};
// Папка server/ модуля: по сокращению "@/features/<модуль>/server" или по относительному пути.
const FEATURE_SERVER = "^(@/features/[^/]+|\\.{1,2}(/[^/]+)*)/server";

const SERVER_INTERNALS = {
  regex: `${FEATURE_SERVER}(/(index|repository|service|auth))?$|^@/lib/server/`,
  message:
    "Интерфейс работает с сервером только через actions.ts (изменения), queries.ts (чтение) и session.ts.",
};
const ANY_SERVER_CODE = {
  regex: `${FEATURE_SERVER}(/.*)?$|^@/lib/server/|^server-only$`,
  message: "Этот файл общий для сервера и браузера — серверный код сюда импортировать нельзя.",
};
const FRAMEWORK = {
  group: ["next", "next/*", "react", "react-dom", "react-dom/*"],
  message:
    "Предметная логика не зависит от Next.js и React — так её можно проверять обычными тестами.",
};
const NEXT_RUNTIME = {
  group: ["next", "next/*"],
  message: "Сервисы и репозитории не знают про Next.js: запрос и cookie им передают явно.",
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
  {
    // Чистая предметная часть: модели, проверки ввода, правила доступа, общие утилиты.
    files: ["src/features/*/{model,schemas,policy}.ts", "src/lib/*.ts"],
    rules: { "no-restricted-imports": restrict([DATABASE, ANY_SERVER_CODE, FRAMEWORK]) },
  },
  {
    // Интерфейс: страницы и компоненты.
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/features/*/components/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
    ],
    ignores: ["src/app/api/health/route.ts"],
    rules: { "no-restricted-imports": restrict([DATABASE, SERVER_INTERNALS]) },
  },
  {
    // Сервисы: правила и сценарии. Без базы и без Next.js.
    files: ["src/features/*/server/service.ts"],
    rules: { "no-restricted-imports": restrict([DATABASE, NEXT_RUNTIME]) },
  },
  {
    // Репозитории: только доступ к данным.
    files: ["src/features/*/server/repository.ts"],
    rules: { "no-restricted-imports": restrict([NEXT_RUNTIME]) },
  },
  {
    // Действия, чтение и сессия: связывают Next.js с сервисами, в базу напрямую не ходят.
    files: ["src/features/*/server/{actions,queries,session,authed-action}.ts"],
    rules: { "no-restricted-imports": restrict([DATABASE]) },
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
