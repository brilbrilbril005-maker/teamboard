import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  formatFullDate,
  formatShortDate,
  isIsoDate,
  isoDateFromToday,
  isoToLocalDate,
  localDateToIso,
  toIsoDate,
  todayIso,
} from "./dates";

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

describe("calendar helpers", () => {
  it("converts an ISO date to a local midnight Date and back without shifting the day", () => {
    const local = isoToLocalDate("2026-11-08");

    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(10);
    expect(local.getDate()).toBe(8);
    expect(localDateToIso(local)).toBe("2026-11-08");
    expect(localDateToIso(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDaysIso("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysIso("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysIso("2026-10-25", 1)).toBe("2026-10-26");
  });

  it("validates ISO dates", () => {
    expect(isIsoDate("2026-11-08")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("08.11.2026")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });

  it("throws on an invalid ISO date instead of producing a wrong day", () => {
    expect(() => isoToLocalDate("not-a-date")).toThrow();
  });
});

describe("Russian date formatting", () => {
  it("formats a short day and month like «15 нояб.»", () => {
    expect(formatShortDate("2026-11-15")).toBe("15 нояб.");
    expect(formatShortDate("2026-05-08")).toBe("8 мая");
  });

  it("formats a date with the year without the «г.» suffix", () => {
    expect(formatFullDate("2026-11-08")).toBe("8 нояб. 2026");
  });

  it("formats a short date the same in any server time zone", () => {
    expect(formatShortDate("2026-01-01")).toBe("1 янв.");
  });
});
