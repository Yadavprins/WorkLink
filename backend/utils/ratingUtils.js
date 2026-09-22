const calculateNextRating = ({ currentAverage = 0, totalRatings = 0, newRating }) => {
  const numericCurrentAverage = Number(currentAverage) || 0;
  const numericTotalRatings = Number(totalRatings) || 0;
  const numericNewRating = Number(newRating);

  if (!Number.isFinite(numericNewRating) || numericNewRating < 1 || numericNewRating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  if (numericTotalRatings <= 0) {
    return Number(numericNewRating.toFixed(1));
  }

  const nextTotalRatings = numericTotalRatings + 1;
  const nextAverage = ((numericCurrentAverage * numericTotalRatings) + numericNewRating) / nextTotalRatings;

  return Number(nextAverage.toFixed(1));
};

module.exports = {
  calculateNextRating,
};
