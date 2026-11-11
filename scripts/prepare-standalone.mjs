/**
 * После сборки докладывает в самодостаточную папку .next/standalone
 * статические файлы — Next.js сам их туда не копирует.
 * После этого приложение запускается одной командой: node .next/standalone/server.js
 */
import { cp, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const standalone = path.join(root, ".next", "standalone");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

if (await exists(standalone)) {
  await cp(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });
  if (await exists(path.join(root, "public"))) {
    await cp(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
  }
  console.info("Самодостаточная сборка готова: .next/standalone");
}
