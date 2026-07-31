export const REVIEW_COMMENT_MAX_LENGTH = 500;

export function computeAverageRating(ratings: number[]): number {
  if (ratings.length === 0) {
    return 0;
  }

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return Math.round((sum / ratings.length) * 100) / 100;
}

export function isValidReviewRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}
