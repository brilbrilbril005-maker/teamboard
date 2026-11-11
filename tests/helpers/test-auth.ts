import type { Database } from "@/db/types";
import { createAuth, type Auth } from "@/features/auth/server/auth";
import type { RequestContext } from "@/lib/server/request";

export function createTestAuth(db: Database): Auth {
  return createAuth({
    db,
    secret: "test-secret-test-secret-test-secret-1234",
    baseUrl: "http://localhost:3000",
  });
}

export function createRequestContext(clientIp = "203.0.113.10"): RequestContext {
  return { headers: new Headers(), clientIp };
}
