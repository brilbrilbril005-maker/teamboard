import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Политика содержимого: браузеру разрешено обращаться только к самому приложению.
 * Это и защита от внедрения чужих скриптов, и техническая гарантия правила
 * «никаких сторонних сервисов» — внешний шрифт или скрипт просто не загрузится.
 * Встроенные скрипты разрешены: без них не работает потоковая отрисовка Next.js
 * (вариант с одноразовыми метками отключил бы предварительную отрисовку страниц).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDevelopment ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Браузер учитывает этот заголовок только при https.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Самодостаточная сборка: для запуска достаточно Node.js, без node_modules.
  output: "standalone",
  poweredByHeader: false,
  // Файлы миграций нужны серверу при старте — включаем их в самодостаточную сборку.
  outputFileTracingIncludes: {
    "/api/health": ["./drizzle/**/*"],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
