import { describe, expect, it } from "vitest";
import { getClientIp } from "./request";

describe("getClientIp", () => {
  it("takes the first address from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });

    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("returns a stable placeholder when no proxy headers are present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
