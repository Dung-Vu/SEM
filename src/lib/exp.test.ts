import { describe, expect, it } from "vitest";

import {
  getExpForNextLevel,
  getKingdomInfo,
  getLevelFromExp,
  getStreakBonus,
} from "./exp";

describe("getLevelFromExp", () => {
  it.each([
    [0, 1],
    [-50, 1],
    [4_999, 9],
    [5_000, 11],
    [20_000, 26],
    [50_000, 46],
    [120_000, 71],
    [249_999, 99],
    [250_000, 100],
    [255_000, 101],
  ])("maps %i total EXP to level %i", (totalExp, expectedLevel) => {
    expect(getLevelFromExp(totalExp)).toBe(expectedLevel);
  });
});

describe("getExpForNextLevel", () => {
  it("returns the current and next EXP thresholds within a tier", () => {
    expect(getExpForNextLevel(1)).toEqual({ current: 0, needed: 555 });
    expect(getExpForNextLevel(11)).toEqual({ current: 5_000, needed: 6_071 });
  });

  it("uses the final tier for levels beyond the configured range", () => {
    expect(getExpForNextLevel(101)).toEqual({ current: 254_482, needed: 258_965 });
  });
});

describe("getKingdomInfo", () => {
  it("returns the tier metadata and icon", () => {
    expect(getKingdomInfo(26)).toEqual({
      name: "Fluency Castle",
      title: "Fluency Mage",
      cefr: "B2",
      icon: "🏰",
    });
  });
});

describe("getStreakBonus", () => {
  it.each([
    [0, 1],
    [3, 1.1],
    [7, 1.25],
    [14, 1.3],
    [30, 1.5],
    [60, 1.75],
    [100, 2],
  ])("returns %i for a streak of %i days", (streak, expectedBonus) => {
    expect(getStreakBonus(streak)).toBe(expectedBonus);
  });
});
