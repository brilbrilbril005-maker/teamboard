import type { Metadata, Viewport } from "next";
// Шрифт Inter хранится в пакете и отдаётся самим приложением — без Google Fonts и CDN.
// Подмножества (кириллица, латиница) грузятся браузером только по мере надобности.
import "@fontsource-variable/inter/wght.css";
import "./globals.css";
import { ThemeScript } from "@/components/ui/theme-script";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: { default: "Teamboard", template: "%s · Teamboard" },
  description: "Задачи команды в одном месте",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Тема по умолчанию светлая независимо от системы — и цвет панели браузера тоже.
  themeColor: "#f5f7fb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Класс темы ставит ThemeScript до отрисовки — React не должен считать это расхождением.
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
