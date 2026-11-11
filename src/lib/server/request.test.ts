import { describe, expect, it } from "vitest";
import { getClientIp } from "./request";

describe("getClientIp", () => {
  it("takes the last address from x-forwarded-for — the one added by our proxy", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.7" });

    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("ignores addresses the client put in front to spoof its origin", () => {
    const spoofed = new Headers({ "x-forwarded-for": "10.0.0.1, 10.0.0.2, 198.51.100.9" });

    expect(getClientIp(spoofed)).toBe("198.51.100.9");
  });

  it("accepts IPv6 addresses", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("rejects values that are not IP addresses", () => {
    const headers = new Headers({ "x-forwarded-for": "x".repeat(5000), "x-real-ip": "not-an-ip" });

    expect(getClientIp(headers)).toBe("unknown");
  });

  it("returns a stable placeholder when no proxy headers are present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
