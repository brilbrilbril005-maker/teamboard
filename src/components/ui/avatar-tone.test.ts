import { describe, expect, it } from "vitest";
import { AVATAR_TONE_COUNT, avatarToneIndex } from "./avatar-tone";

describe("avatarToneIndex", () => {
  it("returns the same tone for the same key", () => {
    expect(avatarToneIndex("user-42")).toBe(avatarToneIndex("user-42"));
  });

  it("always stays within the palette", () => {
    const keys = Array.from({ length: 200 }, (_, index) => `member-${index}`);
    const tones = keys.map(avatarToneIndex);

    expect(tones.every((tone) => tone >= 0 && tone < AVATAR_TONE_COUNT)).toBe(true);
  });

  it("spreads different keys over every tone", () => {
    const keys = Array.from({ length: 200 }, (_, index) => `member-${index}`);

    expect(new Set(keys.map(avatarToneIndex)).size).toBe(AVATAR_TONE_COUNT);
  });

  it("handles an empty key", () => {
    expect(avatarToneIndex("")).toBeGreaterThanOrEqual(0);
  });
});
