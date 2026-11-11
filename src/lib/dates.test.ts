import { describe, expect, it } from "vitest";
import { isoDateFromToday, toIsoDate, todayIso } from "./dates";

const LATE_EVENING_UTC = new Date("2026-11-11T22:30:00.000Z");

describe("dates", () => {
  it("formats a date as YYYY-MM-DD in the given time zone", () => {
    expect(toIsoDate(LATE_EVENING_UTC, "UTC")).toBe("2026-11-11");
    expect(toIsoDate(LATE_EVENING_UTC, "Europe/Moscow")).toBe("2026-11-12");
  });

  it("computes today in the team time zone regardless of the server zone", () => {
    expect(todayIso(LATE_EVENING_UTC)).toBe("2026-11-12");
    expect(todayIso(new Date("2026-11-11T20:59:59.000Z"))).toBe("2026-11-11");
  });

  it("shifts by whole days in both directions", () => {
    const noon = new Date("2026-11-11T09:00:00.000Z");

    expect(isoDateFromToday(0, noon)).toBe("2026-11-11");
    expect(isoDateFromToday(2, noon)).toBe("2026-11-13");
    expect(isoDateFromToday(-3, noon)).toBe("2026-11-08");
  });
});
