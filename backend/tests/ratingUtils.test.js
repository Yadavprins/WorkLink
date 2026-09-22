const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateNextRating } = require("../utils/ratingUtils");

test("first rating becomes that value", () => {
  assert.equal(calculateNextRating({ currentAverage: 0, totalRatings: 0, newRating: 5 }), 5);
});

test("weighted average keeps prior reputation while incorporating the latest rating", () => {
  assert.equal(calculateNextRating({ currentAverage: 4.5, totalRatings: 2, newRating: 3 }), 4);
  assert.equal(calculateNextRating({ currentAverage: 4.2, totalRatings: 4, newRating: 5 }), 4.4);
});
