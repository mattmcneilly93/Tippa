import { describe, expect, it } from "vitest";
import {
  calculateExactScoreResult,
  calculateGroupTablePoints,
  calculateOutcomePoints,
  knockoutPointsForRound,
  scoringPresets
} from "./scoring";

const finished = { status: "finished" as const };

describe("group table scoring", () => {
  it("scores exact full table with advancing and winner bonuses", () => {
    expect(
      calculateGroupTablePoints(["a", "b", "c", "d"], ["a", "b", "c", "d"], 2)
    ).toBe(18);
  });

  it("scores correct advancing teams in wrong order", () => {
    expect(
      calculateGroupTablePoints(["b", "a", "c", "d"], ["a", "b", "c", "d"], 2)
    ).toBe(10);
  });

  it("scores lower when qualifiers are wrong", () => {
    expect(
      calculateGroupTablePoints(["c", "d", "a", "b"], ["a", "b", "c", "d"], 2)
    ).toBe(0);
  });
});

describe("match prediction scoring", () => {
  it.each([
    ["home", 2, 1, 2],
    ["draw", 1, 1, 2],
    ["away", 0, 2, 2],
    ["home", 1, 1, 0]
  ] as const)("scores %s prediction for %i-%i", (prediction, homeScore, awayScore, expected) => {
    expect(
      calculateOutcomePoints(prediction, {
        ...finished,
        homeScore,
        awayScore
      })
    ).toBe(expected);
  });

  it.each([
    [2, 1, 2, 1, 4],
    [2, 1, 1, 0, 3],
    [2, 1, 3, 2, 3],
    [2, 1, 1, 1, 0],
    [1, 1, 0, 0, 3],
    [1, 1, 1, 1, 4]
  ])("scores actual %i-%i predicted %i-%i", (ah, aa, ph, pa, expected) => {
    expect(
      calculateExactScoreResult(
        { homeScore: ph, awayScore: pa },
        { ...finished, homeScore: ah, awayScore: aa }
      ).points
    ).toBe(expected);
  });
});

describe("knockout scoring", () => {
  it("uses balanced round weights by default", () => {
    expect(knockoutPointsForRound("round_of_32")).toBe(2);
    expect(knockoutPointsForRound("round_of_16")).toBe(3);
    expect(knockoutPointsForRound("quarter_final")).toBe(5);
    expect(knockoutPointsForRound("semi_final")).toBe(8);
    expect(knockoutPointsForRound("final")).toBe(13);
    expect(knockoutPointsForRound("third_place")).toBe(3);
  });

  it("supports high-stakes champion weighting", () => {
    expect(knockoutPointsForRound("final", scoringPresets.high_stakes)).toBe(20);
  });
});
