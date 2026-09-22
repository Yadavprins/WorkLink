const crypto = require("crypto");
const User = require("../models/User");
const Worker = require("../models/Worker");
const PromoCode = require("../models/PromoCode");
const Subscription = require("../models/Subscription");
const Referral = require("../models/Referral");
const { getPromoDiscount, rewardReferral } = require("../services/growthService");
const { getWallet } = require("../services/paymentService");

const getReferral = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user.referralCode) {
        user.referralCode = `NEX${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        await user.save();
    }
    const referrals = await Referral.find({ referrer: user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, code: user.referralCode, referrals });
};

const applyReferral = async (req, res) => {
    const code = String(req.body?.code || "").trim().toUpperCase();
    const referrer = await User.findOne({ referralCode: code });
    if (!referrer || referrer._id.toString() === req.user.id.toString()) return res.status(400).json({ success: false, message: "Invalid referral code" });
    const existing = await Referral.findOne({ referred: req.user.id });
    if (existing) return res.status(409).json({ success: false, message: "Referral already applied" });
    await Referral.create({ referrer: referrer._id, referred: req.user.id, code });
    return res.status(201).json({ success: true, message: "Referral applied" });
};

const validatePromo = async (req, res) => {
    try {
        const result = await getPromoDiscount({ code: req.body?.code, amount: Number(req.body?.amount), city: req.body?.city });
        return res.status(200).json({ success: true, discount: result.discount, promo: result.promo });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const subscribe = async (req, res) => {
    const plans = { basic: 99, pro: 299, business: 999 };
    const plan = String(req.body?.plan || "").toLowerCase();
    if (!plans[plan]) return res.status(400).json({ success: false, message: "Invalid subscription plan" });
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);
    const subscription = await Subscription.findOneAndUpdate({ owner: req.user.id, ownerRole: req.user.role }, { owner: req.user.id, ownerRole: req.user.role, plan, monthlyPrice: plans[plan], status: "active", renewsAt }, { new: true, upsert: true, runValidators: true });
    return res.status(200).json({ success: true, subscription });
};

const getSubscription = async (req, res) => {
    const subscription = await Subscription.findOne({ owner: req.user.id, ownerRole: req.user.role, status: "active" });
    return res.status(200).json({ success: true, subscription });
};

const featureWorker = async (req, res) => {
    const days = Math.min(30, Math.max(1, Number(req.body?.days || 7)));
    const worker = await Worker.findById(req.params.workerId);
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });
    worker.featuredUntil = new Date(Date.now() + days * 86400000);
    worker.featuredCity = String(req.body?.city || worker.city).trim();
    worker.badges = [...new Set([...(worker.badges || []), "Featured Worker"] )];
    await worker.save();
    return res.status(200).json({ success: true, worker });
};

module.exports = { getReferral, applyReferral, validatePromo, subscribe, getSubscription, featureWorker, rewardReferral };
