import path from "node:path";
import { defineConfig } from "vitest/config";

const COVERAGE_THRESHOLD = 80;

export default defineConfig({
  resolve: {
    // Понимает сокращение "@/..." из tsconfig.json.
    tsconfigPaths: true,
    alias: {
      // Пакет-предохранитель Next.js вне Next.js бросает ошибку — в тестах заменяем пустышкой.
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/architecture/**/*.test.ts"],
    // Тесты с базой запускают PostgreSQL в памяти и применяют миграции.
    testTimeout: 20_000,
    hookTimeout: 30_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.d.ts",
        // Склейка с Next.js и точки сборки зависимостей — проверяются сквозными тестами.
        "src/app/**",
        "src/proxy.ts",
        "src/instrumentation.ts",
        "src/**/components/**",
        "src/**/server/index.ts",
        "src/**/server/actions.ts",
        "src/**/server/queries.ts",
        "src/**/server/session.ts",
        "src/**/server/authed-action.ts",
        "src/db/client.ts",
        "src/db/bootstrap.ts",
        "src/db/migrate.ts",
        "src/db/lock.ts",
        "src/db/types.ts",
        "src/db/schema/index.ts",
      ],
      thresholds: {
        lines: COVERAGE_THRESHOLD,
        functions: COVERAGE_THRESHOLD,
        branches: COVERAGE_THRESHOLD,
        statements: COVERAGE_THRESHOLD,
      },
    },
  },
});
