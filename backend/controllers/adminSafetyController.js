const Job = require("../models/Job");
const SOSAlert = require("../models/SOSAlert");

const getDemandHeatmap = async (req, res) => {
    try {
        const since = new Date(Date.now() - Number(req.query.days || 30) * 24 * 60 * 60 * 1000);
        const cells = await Job.aggregate([
            { $match: { createdAt: { $gte: since }, "location.latitude": { $ne: null }, "location.longitude": { $ne: null } } },
            { $project: { latitude: "$location.latitude", longitude: "$location.longitude", category: 1, status: 1 } },
            { $group: {
                _id: {
                    latitude: { $round: ["$latitude", 2] },
                    longitude: { $round: ["$longitude", 2] }
                },
                demand: { $sum: 1 },
                active: { $sum: { $cond: [{ $in: ["$status", ["posted", "searching", "accepted", "on_the_way", "in_progress"]] }, 1, 0] } },
                categories: { $addToSet: "$category" }
            } },
            { $project: { _id: 0, latitude: "$_id.latitude", longitude: "$_id.longitude", demand: 1, active: 1, categories: 1 } },
            { $sort: { demand: -1 } },
            { $limit: 500 }
        ]);
        return res.status(200).json({ success: true, days: Number(req.query.days || 30), cells });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to load demand heat map" });
    }
};

const getFraudReview = async (req, res) => {
    const jobs = await Job.find({ aiRiskScore: { $gte: Number(req.query.minimum || 0.5) } })
        .populate("customer", "name email phone")
        .sort({ aiRiskScore: -1, createdAt: -1 })
        .limit(200);
    return res.status(200).json({ success: true, jobs });
};

const getSOSAlerts = async (req, res) => {
    const alerts = await SOSAlert.find({ status: { $ne: "resolved" } }).populate("job", "title status").sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, alerts });
};

module.exports = { getDemandHeatmap, getFraudReview, getSOSAlerts };
