const Worker = require("../models/Worker");

// ======================================================
// GET AVAILABLE WORKERS FOR CUSTOMER
// GET /api/customers/workers
// ======================================================

const getCustomerWorkers = async (req, res) => {
    try {
        const {
            city,
            skill
        } = req.query || {};

        const query = {
            isAvailable: true
        };

        // --------------------------------------------------
        // CITY / DISTRICT FILTER
        // --------------------------------------------------

        if (city) {
            query.city = {
                $regex: String(city).trim(),
                $options: "i"
            };
        }

        // --------------------------------------------------
        // SKILL FILTER
        // --------------------------------------------------

        if (skill) {
            query.skills = {
                $elemMatch: {
                    $regex: String(skill).trim(),
                    $options: "i"
                }
            };
        }

        // --------------------------------------------------
        // FETCH WORKERS
        // --------------------------------------------------

        const workers = await Worker.find(query)
            .select(
                "name phone city area skills experience rating totalRatings completedJobs isAvailable location certificates portfolio verificationStatus verifiedAt trustScore badges featuredUntil featuredCity"
            )
            .sort({ featuredUntil: -1, rating: -1, completedJobs: -1 })
            .limit(50);

        return res.status(200).json({
            success: true,
            count: workers.length,
            workers
        });

    } catch (error) {
        console.error(
            "Get customer workers error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load available workers."
        });
    }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    getCustomerWorkers
};