const Job = require("../models/Job");
const WalletTransaction = require("../models/WalletTransaction");
const {
    getWallet,
    topUpWallet,
    holdJobPayment,
    releaseJobEscrow
} = require("../services/paymentService");

const getMyWallet = async (req, res) => {
    const wallet = await getWallet(req.user.id, req.user.role);
    const transactions = await WalletTransaction.find({ owner: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50);
    return res.status(200).json({ success: true, wallet, transactions });
};

const addWalletFunds = async (req, res) => {
    try {
        const wallet = await topUpWallet({
            owner: req.user.id,
            ownerRole: req.user.role,
            amount: req.body?.amount
        });
        return res.status(200).json({ success: true, message: "Wallet topped up in sandbox mode", wallet });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const payForJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ success: false, message: "Job not found" });

        const result = await holdJobPayment({
            job,
            customerId: req.user.id,
            paymentMethod: String(req.body?.paymentMethod || "upi").toLowerCase(),
            promoCode: req.body?.promoCode
        });

        return res.status(200).json({
            success: true,
            message: "Payment captured and held in escrow",
            payment: {
                transactionId: result.job.transactionId,
                paymentMethod: result.job.paymentMethod,
                paymentStatus: result.job.paymentStatus,
                escrowStatus: result.job.escrowStatus,
                ...result.breakdown
            },
            job: result.job
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const releasePayment = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ success: false, message: "Job not found" });
        if (job.customer.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "Only the customer can release escrow" });
        }
        if (job.status !== "completed") {
            return res.status(400).json({ success: false, message: "Escrow can be released after job completion" });
        }
        const payout = await releaseJobEscrow(job);
        return res.status(200).json({ success: true, message: "Escrow released", payout });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = { getMyWallet, addWalletFunds, payForJob, releasePayment };
