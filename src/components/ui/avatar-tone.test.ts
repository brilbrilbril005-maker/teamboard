import { describe, expect, it } from "vitest";
import { AVATAR_TONE_COUNT, assignAvatarTones, avatarToneIndex } from "./avatar-tone";

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

describe("assignAvatarTones", () => {
  it("gives every member a different tone while the palette lasts", () => {
    // Arrange
    const keys = ["d", "a", "c", "b", "e", "f"];

    // Act
    const tones = assignAvatarTones(keys);

    // Assert
    expect(new Set(keys.map((key) => tones.get(key))).size).toBe(AVATAR_TONE_COUNT);
  });

  it("does not depend on the order of the list", () => {
    const forward = assignAvatarTones(["x1", "x2", "x3", "x4"]);
    const backward = assignAvatarTones(["x4", "x3", "x2", "x1"]);

    expect([...backward.entries()].toSorted()).toEqual([...forward.entries()].toSorted());
  });

  it("starts from the member's own tone when it is free", () => {
    expect(assignAvatarTones(["solo"]).get("solo")).toBe(avatarToneIndex("solo"));
  });

  it("reuses tones once the palette is exhausted", () => {
    const keys = Array.from({ length: AVATAR_TONE_COUNT + 3 }, (_, index) => `member-${index}`);

    const tones = assignAvatarTones(keys);

    expect(tones.size).toBe(keys.length);
    expect([...tones.values()].every((tone) => tone >= 0 && tone < AVATAR_TONE_COUNT)).toBe(true);
  });
});
