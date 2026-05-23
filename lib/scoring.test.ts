import { describe, expect, it } from "vitest";
import { calculatePredictionPoints } from "./scoring";

const finished = { status: "finished" as const };

describe("calculatePredictionPoints", () => {
  it.each([
    [2, 1, 2, 1, 3],
    [2, 1, 1, 0, 2],
    [2, 1, 3, 2, 2],
    [2, 1, 1, 1, 0],
    [1, 1, 0, 0, 2],
    [1, 1, 1, 1, 3]
  ])("scores actual %i-%i predicted %i-%i", (ah, aa, ph, pa, expected) => {
    expect(
      calculatePredictionPoints(
        { homeScore: ph, awayScore: pa },
        { ...finished, homeScore: ah, awayScore: aa }
      )
    ).toBe(expected);
  });
});
