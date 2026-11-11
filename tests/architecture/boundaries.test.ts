import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Проверка самих правил границ между слоями (eslint.config.mjs).
 * Если кто-то ослабит правило, эти тесты упадут: архитектура охраняется
 * не только линтером, но и тестом на линтер.
 */

const RULE = "no-restricted-imports";

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint();
});

async function violations(filePath: string, importLine: string): Promise<number> {
  const [result] = await eslint.lintText(`${importLine}\nexport const used = [x];\n`, { filePath });
  return result?.messages.filter((message) => message.ruleId === RULE).length ?? 0;
}

const FORBIDDEN: ReadonlyArray<readonly [why: string, file: string, importLine: string]> = [
  [
    "страница → база по сокращению",
    "src/app/x/page.tsx",
    'import { getDb as x } from "@/db/client";',
  ],
  [
    "страница → база по относительному пути",
    "src/app/x/page.tsx",
    'import { getDb as x } from "../../db/client";',
  ],
  [
    "страница → сервис",
    "src/app/x/page.tsx",
    'import { x } from "@/features/tasks/server/service";',
  ],
  [
    "страница → сборка модуля",
    "src/app/x/page.tsx",
    'import { x } from "@/features/tasks/server";',
  ],
  [
    "страница → обёртка действий",
    "src/app/x/page.tsx",
    'import { authedAction as x } from "@/features/auth/server/authed-action";',
  ],
  [
    "страница → вложенный серверный файл",
    "src/app/x/page.tsx",
    'import { x } from "@/features/tasks/server/internal/thing";',
  ],
  [
    "страница → серверные утилиты",
    "src/app/x/page.tsx",
    'import { logger as x } from "@/lib/server/logger";',
  ],
  [
    "компонент → репозиторий",
    "src/features/tasks/components/card.tsx",
    'import { x } from "../server/repository";',
  ],
  [
    "компонент → чужой репозиторий",
    "src/features/tasks/components/card.tsx",
    'import { x } from "../../users/server/repository";',
  ],
  ["хук → база", "src/hooks/use-thing.ts", 'import { getDb as x } from "@/db/client";'],
  ["модель → база", "src/features/tasks/model.ts", 'import * as x from "@/db";'],
  ["модель → React", "src/features/tasks/model.ts", 'import { cache as x } from "react";'],
  [
    "права → серверный код",
    "src/features/tasks/policy.ts",
    'import { requireUser as x } from "../auth/server/session";',
  ],
  [
    "схемы → Next.js",
    "src/features/tasks/schemas.ts",
    'import { headers as x } from "next/headers";',
  ],
  [
    "общая утилита → серверный код",
    "src/lib/thing.ts",
    'import { getEnv as x } from "./server/env";',
  ],
  [
    "новый файл модуля → ORM",
    "src/features/tasks/utils.ts",
    'import { eq as x } from "drizzle-orm";',
  ],
  [
    "новый серверный файл → ORM",
    "src/features/tasks/server/mappers.ts",
    'import { eq as x } from "drizzle-orm";',
  ],
  [
    "сервис → ORM",
    "src/features/tasks/server/service.ts",
    'import { eq as x } from "drizzle-orm";',
  ],
  [
    "сервис → Next.js",
    "src/features/tasks/server/service.ts",
    'import { headers as x } from "next/headers";',
  ],
  [
    "сервис → сессия",
    "src/features/tasks/server/service.ts",
    'import { requireUser as x } from "../../auth/server/session";',
  ],
  ["сервис → действия", "src/features/tasks/server/service.ts", 'import { x } from "./actions";'],
  [
    "репозиторий → сервис",
    "src/features/tasks/server/repository.ts",
    'import { x } from "./service";',
  ],
  [
    "репозиторий → Next.js",
    "src/features/tasks/server/repository.ts",
    'import { cookies as x } from "next/headers";',
  ],
  [
    "действия → репозиторий напрямую",
    "src/features/tasks/server/actions.ts",
    'import { x } from "./repository";',
  ],
  [
    "действия → база",
    "src/features/tasks/server/actions.ts",
    'import { tasks as x } from "@/db/schema";',
  ],
  [
    "чтение → база",
    "src/features/tasks/server/queries.ts",
    'import { getDb as x } from "@/db/client";',
  ],
];

const ALLOWED: ReadonlyArray<readonly [why: string, file: string, importLine: string]> = [
  [
    "страница → чтение",
    "src/app/x/page.tsx",
    'import { x } from "@/features/tasks/server/queries";',
  ],
  [
    "страница → сессия",
    "src/app/x/page.tsx",
    'import { requireUser as x } from "@/features/auth/server/session";',
  ],
  [
    "компонент → действия",
    "src/features/tasks/components/card.tsx",
    'import { x } from "../server/actions";',
  ],
  [
    "компонент → модель",
    "src/features/tasks/components/card.tsx",
    'import { TASK_STATUSES as x } from "../model";',
  ],
  [
    "компонент → Next.js",
    "src/features/tasks/components/card.tsx",
    'import { connection as x } from "next/server";',
  ],
  [
    "действия → сборка модуля",
    "src/features/tasks/server/actions.ts",
    'import { x } from "./index";',
  ],
  [
    "действия → обёртка",
    "src/features/tasks/server/actions.ts",
    'import { authedAction as x } from "@/features/auth/server/authed-action";',
  ],
  [
    "сервис → права",
    "src/features/tasks/server/service.ts",
    'import { canDeleteTask as x } from "../policy";',
  ],
  [
    "сервис → тип репозитория",
    "src/features/tasks/server/service.ts",
    'import { type TaskRepository as x } from "./repository";',
  ],
  [
    "сервис → ошибки",
    "src/features/tasks/server/service.ts",
    'import { NotFoundError as x } from "@/lib/errors";',
  ],
  [
    "репозиторий → ORM",
    "src/features/tasks/server/repository.ts",
    'import { eq as x } from "drizzle-orm";',
  ],
  [
    "репозиторий → схема",
    "src/features/tasks/server/repository.ts",
    'import { tasks as x } from "@/db/schema";',
  ],
  [
    "сборка модуля → подключение",
    "src/features/tasks/server/index.ts",
    'import { getDb as x } from "@/db/client";',
  ],
  [
    "схема базы → модель",
    "src/db/schema/tasks.ts",
    'import { TASK_STATUSES as x } from "@/features/tasks/model";',
  ],
  [
    "модель → чужая модель",
    "src/features/tasks/model.ts",
    'import { type TeamMember as x } from "@/features/users/model";',
  ],
];

describe("layer boundaries", () => {
  it.each(FORBIDDEN)("forbids: %s", async (_why, file, importLine) => {
    expect(await violations(file, importLine)).toBe(1);
  });

  it.each(ALLOWED)("allows: %s", async (_why, file, importLine) => {
    expect(await violations(file, importLine)).toBe(0);
  });
});
