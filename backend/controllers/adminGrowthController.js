const Job = require("../models/Job");
const Worker = require("../models/Worker");
const CityConfig = require("../models/CityConfig");
const WalletTransaction = require("../models/WalletTransaction");
const PromoCode = require("../models/PromoCode");

const getRevenueDashboard = async (req, res) => {
    const since = new Date(Date.now() - Number(req.query.months || 12) * 30 * 86400000);
    const [summary, monthly, byCity] = await Promise.all([
        WalletTransaction.aggregate([{ $match: { type: "commission", createdAt: { $gte: since } } }, { $group: { _id: null, revenue: { $sum: "$amount" }, transactions: { $sum: 1 } } }]),
        WalletTransaction.aggregate([{ $match: { type: "commission", createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$amount" } } }, { $sort: { _id: 1 } }]),
        Job.aggregate([{ $match: { paymentStatus: "paid", createdAt: { $gte: since } } }, { $group: { _id: "$city", gross: { $sum: { $ifNull: ["$grossAmount", "$finalPrice"] } }, commission: { $sum: "$platformFee" }, jobs: { $sum: 1 } } }, { $sort: { commission: -1 } }])
    ]);
    return res.status(200).json({ success: true, summary: summary[0] || { revenue: 0, transactions: 0 }, monthly, byCity });
};

const getCityControls = async (req, res) => {
    const cities = await CityConfig.find().sort({ city: 1 });
    return res.status(200).json({ success: true, cities });
};

const updateCityControls = async (req, res) => {
    const city = String(req.params.city || "").trim();
    const config = await CityConfig.findOneAndUpdate({ city }, { city, ...req.body }, { new: true, upsert: true, runValidators: true });
    return res.status(200).json({ success: true, config });
};

const createPromo = async (req, res) => {
    const promo = await PromoCode.create({ ...req.body, code: String(req.body.code).toUpperCase() });
    return res.status(201).json({ success: true, promo });
};

const featureWorker = async (req, res) => {
    const worker = await Worker.findById(req.params.workerId);
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });
    worker.featuredUntil = new Date(Date.now() + Math.min(30, Number(req.body?.days || 7)) * 86400000);
    worker.featuredCity = String(req.body?.city || worker.city).trim();
    worker.badges = [...new Set([...(worker.badges || []), "Featured Worker"] )];
    await worker.save();
    return res.status(200).json({ success: true, worker });
};

module.exports = { getRevenueDashboard, getCityControls, updateCityControls, createPromo, featureWorker };
