const mongoose = require("mongoose");
const Job = require("../models/Job");
const Worker = require("../models/Worker");
const { calculateDistance } = require("../services/locationService");
const {
    predictJobDetails,
    estimateDynamicPrice,
    analyzeProblemImage,
    detectFakeJob
} = require("../services/aiService");

const analyzeDescription = async (req, res) => {
    try {
        const prediction = await predictJobDetails(req.body?.description);
        return res.status(200).json({ success: true, prediction });
    } catch (error) {
        return res.status(503).json({ success: false, message: error.message });
    }
};

const estimatePrice = async (req, res) => {
    try {
        const estimate = await estimateDynamicPrice(req.body || {});
        return res.status(200).json({ success: true, estimate });
    } catch (error) {
        return res.status(503).json({ success: false, message: error.message });
    }
};

const inspectImage = async (req, res) => {
    try {
        const analysis = await analyzeProblemImage(req.body?.imageUrl);
        return res.status(200).json({ success: true, analysis });
    } catch (error) {
        return res.status(503).json({ success: false, message: error.message });
    }
};

const inspectFakeJob = async (req, res) => {
    try {
        const result = await detectFakeJob(req.body || {});
        return res.status(200).json({ success: true, result });
    } catch (error) {
        return res.status(503).json({ success: false, message: error.message });
    }
};

const bestWorkerMatches = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
        return res.status(400).json({ success: false, message: "Invalid job ID" });
    }

    const job = await Job.findOne({ _id: req.params.jobId, customer: req.user.id });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    const workers = await Worker.find({
        isBlocked: { $ne: true },
        isAvailable: true,
        skills: { $in: [job.requiredSkill] }
    }).select("name phone skills location rating totalRatings completedJobs");

    const matches = workers.map((worker) => {
        const distance = worker.location?.latitude != null &&
            worker.location?.longitude != null
            ? calculateDistance(
                worker.location.latitude,
                worker.location.longitude,
                job.location.latitude,
                job.location.longitude
            )
            : null;
        const skillScore = worker.skills?.some((skill) => String(skill).toLowerCase() === String(job.requiredSkill).toLowerCase()) ? 40 : 0;
        const ratingScore = Math.min(30, Number(worker.rating || 0) * 6);
        const distanceScore = Math.max(0, 30 - Number(distance || 30) * 3);
        return {
            worker,
            distanceKm: Number(Number(distance || 0).toFixed(2)),
            matchScore: Math.round(skillScore + ratingScore + distanceScore)
        };
    }).sort((left, right) => right.matchScore - left.matchScore).slice(0, 10);

    return res.status(200).json({ success: true, matches });
};

module.exports = {
    analyzeDescription,
    estimatePrice,
    inspectImage,
    inspectFakeJob,
    bestWorkerMatches
};
