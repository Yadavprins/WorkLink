const mongoose = require("mongoose");
const User = require("../models/User");
const Worker = require("../models/Worker");
const Job = require("../models/Job");
const B2BAccount = require("../models/B2BAccount");
const { getRequiredSkill } = require("../utils/skillMap");

const toggleFavoriteWorker = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.workerId)) return res.status(400).json({ success: false, message: "Invalid worker ID" });
        const worker = await Worker.findOne({ _id: req.params.workerId, isBlocked: { $ne: true } }).select("name skills rating trustScore badges");
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        const customer = await User.findById(req.user.id);
        const index = customer.favoriteWorkers.findIndex((id) => id.toString() === worker._id.toString());
        if (index >= 0) customer.favoriteWorkers.splice(index, 1);
        else customer.favoriteWorkers.push(worker._id);
        await customer.save();

        const favorites = await User.findById(customer._id).populate("favoriteWorkers", "name skills rating experience trustScore badges verificationStatus").select("favoriteWorkers");
        return res.status(200).json({ success: true, favorite: index < 0, workers: favorites.favoriteWorkers });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to update favorite worker" });
    }
};

const getFavoriteWorkers = async (req, res) => {
    const customer = await User.findById(req.user.id).populate("favoriteWorkers", "name phone skills rating experience trustScore badges verificationStatus location city area");
    return res.status(200).json({ success: true, workers: customer?.favoriteWorkers || [] });
};

const getScheduledBookings = async (req, res) => {
    const jobs = await Job.find({ customer: req.user.id, scheduledAt: { $ne: null }, status: { $nin: ["completed", "cancelled"] } })
        .populate("assignedWorker", "name phone")
        .sort({ scheduledAt: 1 });
    return res.status(200).json({ success: true, jobs });
};

const repeatBooking = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.jobId)) return res.status(400).json({ success: false, message: "Invalid job ID" });
        const original = await Job.findOne({ _id: req.params.jobId, customer: req.user.id });
        if (!original) return res.status(404).json({ success: false, message: "Previous booking not found" });

        const scheduledAt = req.body?.scheduledAt ? new Date(req.body.scheduledAt) : null;
        if (scheduledAt && Number.isNaN(scheduledAt.getTime())) return res.status(400).json({ success: false, message: "Invalid scheduled date" });
        if (scheduledAt && scheduledAt <= new Date()) return res.status(400).json({ success: false, message: "Scheduled time must be in the future" });

        const repeated = await Job.create({
            customer: req.user.id,
            title: original.title,
            description: original.description,
            category: original.category,
            requiredSkill: original.requiredSkill || getRequiredSkill(original.category, ""),
            difficulty: original.difficulty,
            image: original.image,
            city: original.city,
            area: original.area,
            address: original.address,
            location: original.location,
            urgency: Boolean(req.body?.isEmergency) ? "urgent" : original.urgency,
            isEmergency: Boolean(req.body?.isEmergency),
            scheduledAt,
            bookingType: original.bookingType,
            estimatedMinPrice: original.estimatedMinPrice,
            estimatedMaxPrice: original.estimatedMaxPrice,
            repeatOf: original._id,
            businessAccount: original.businessAccount,
            status: "posted",
            paymentStatus: "pending"
        });
        return res.status(201).json({ success: true, message: "Repeat booking created", job: repeated });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const createB2BAccount = async (req, res) => {
    try {
        const { organizationType, organizationName, contactName, contactPhone, sites = [] } = req.body || {};
        if (!["society", "hotel", "office"].includes(organizationType) || !organizationName || !contactName || !contactPhone) {
            return res.status(400).json({ success: false, message: "Organization type, name and contact details are required" });
        }
        const account = await B2BAccount.findOneAndUpdate(
            { owner: req.user.id },
            { owner: req.user.id, organizationType, organizationName: String(organizationName).trim(), contactName: String(contactName).trim(), contactPhone: String(contactPhone).trim(), sites },
            { new: true, upsert: true, runValidators: true }
        );
        await User.findByIdAndUpdate(req.user.id, { accountType: "business", businessAccount: account._id });
        return res.status(200).json({ success: true, account });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getB2BAccount = async (req, res) => {
    const account = await B2BAccount.findOne({ owner: req.user.id });
    return res.status(200).json({ success: true, account });
};

module.exports = { toggleFavoriteWorker, getFavoriteWorkers, getScheduledBookings, repeatBooking, createB2BAccount, getB2BAccount };
