import { describe, expect, it } from "vitest";

import {
  computeAverageRating,
  isValidReviewRating,
} from "../../src/lib/domain/reviews";

describe("reviews domain", () => {
  it("computes the rounded average rating", () => {
    expect(computeAverageRating([5, 4, 3])).toBe(4);
    expect(computeAverageRating([5, 5])).toBe(5);
    expect(computeAverageRating([4, 3])).toBe(3.5);
    expect(computeAverageRating([1, 2, 2, 5])).toBe(2.5);
  });

  it("returns zero for an empty rating list", () => {
    expect(computeAverageRating([])).toBe(0);
  });

  it("accepts only integer ratings between one and five", () => {
    expect(isValidReviewRating(1)).toBe(true);
    expect(isValidReviewRating(5)).toBe(true);
    expect(isValidReviewRating(0)).toBe(false);
    expect(isValidReviewRating(6)).toBe(false);
    expect(isValidReviewRating(3.5)).toBe(false);
  });
});
