const calculateTrustScore = (worker) => {
    const verificationScore = worker.verificationStatus === "approved" ? 30 : 0;
    const ratingScore = Math.min(25, Number(worker.rating || 0) * 5);
    const completionScore = Math.min(20, Number(worker.completedJobs || 0) * 2);
    const experienceScore = Math.min(15, Number(worker.experience || 0) * 3);
    const portfolioScore = Math.min(10, (worker.portfolio || []).length * 2);

    return Math.round(verificationScore + ratingScore + completionScore + experienceScore + portfolioScore);
};

const getTrustBadges = (worker) => {
    const badges = [];
    if (worker.verificationStatus === "approved") badges.push("Verified Professional");
    if (Number(worker.rating || 0) >= 4.5 && Number(worker.totalRatings || 0) >= 5) badges.push("Top Rated");
    if (Number(worker.completedJobs || 0) >= 10) badges.push("Reliable Service");
    if (Number(worker.experience || 0) >= 5) badges.push("Experienced");
    if ((worker.portfolio || []).length >= 3) badges.push("Portfolio Pro");
    return badges;
};

module.exports = { calculateTrustScore, getTrustBadges };
