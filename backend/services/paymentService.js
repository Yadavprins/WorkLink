const crypto = require("crypto");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const Job = require("../models/Job");
const Worker = require("../models/Worker");
const { getPromoDiscount } = require("./growthService");

const COMMISSION_RATE = Math.min(
    0.5,
    Math.max(0, Number(process.env.PLATFORM_COMMISSION_RATE || 0.15))
);

const makeReference = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

const getWallet = async (owner, ownerRole) => Wallet.findOneAndUpdate(
    { owner, ownerRole },
    { $setOnInsert: { owner, ownerRole, balance: 0, heldBalance: 0 } },
    { new: true, upsert: true }
);

const recordTransaction = async ({ wallet, type, amount, job = null, description }) => WalletTransaction.create({
    wallet: wallet._id,
    owner: wallet.owner,
    ownerRole: wallet.ownerRole,
    type,
    amount,
    job,
    description,
    reference: makeReference(type.toUpperCase())
});

const calculatePaymentBreakdown = (amount) => {
    const grossAmount = Number(amount.toFixed(2));
    const commissionAmount = Number((grossAmount * COMMISSION_RATE).toFixed(2));
    return {
        grossAmount,
        commissionAmount,
        workerPayout: Number((grossAmount - commissionAmount).toFixed(2))
    };
};

const holdJobPayment = async ({ job, customerId, paymentMethod, promoCode }) => {
    if (job.customer.toString() !== customerId.toString()) {
        throw new Error("You do not own this job");
    }
    if (job.status !== "in_progress") {
        throw new Error("Payment can only be made while the job is in progress");
    }
    if (!job.finalPrice || Number(job.finalPrice) <= 0) {
        throw new Error("Final price has not been set yet");
    }
    if (job.escrowStatus === "held" || job.paymentStatus === "paid") {
        throw new Error("Payment has already been completed");
    }
    if (!["upi", "card", "wallet"].includes(paymentMethod)) {
        throw new Error("Payment method must be upi, card, or wallet");
    }

    const customerWallet = await getWallet(customerId, "customer");
    const promo = await getPromoDiscount({ code: promoCode, amount: Number(job.finalPrice), city: job.city });
    const payableAmount = Number((Number(job.finalPrice) - promo.discount).toFixed(2));
    const breakdown = calculatePaymentBreakdown(payableAmount);

    if (paymentMethod === "wallet") {
        if (customerWallet.balance < breakdown.grossAmount) {
            throw new Error("Insufficient wallet balance");
        }
        customerWallet.balance = Number((customerWallet.balance - breakdown.grossAmount).toFixed(2));
        await customerWallet.save();
    }

    customerWallet.heldBalance = Number((customerWallet.heldBalance + breakdown.grossAmount).toFixed(2));
    await customerWallet.save();
    await recordTransaction({
        wallet: customerWallet,
        type: "escrow_hold",
        amount: breakdown.grossAmount,
        job: job._id,
        description: `Escrow hold for ${job.title}`
    });

    job.paymentStatus = "paid";
    job.paymentMethod = paymentMethod;
    job.transactionId = makeReference(paymentMethod.toUpperCase());
    job.escrowStatus = "held";
    job.grossAmount = breakdown.grossAmount;
    job.platformFee = breakdown.commissionAmount;
    job.workerPayout = breakdown.workerPayout;
    job.discount = promo.discount;
    job.promoCode = promo.promo?.code || "";
    job.paidAt = new Date();
    job.invoiceNumber = `INV_${Date.now()}`;
    await job.save();

    if (promo.promo) {
        promo.promo.usedCount += 1;
        await promo.promo.save();
    }

    return { job, breakdown };
};

const releaseJobEscrow = async (job) => {
    if (job.escrowStatus !== "held" || !job.assignedWorker) {
        return null;
    }

    const customerWallet = await getWallet(job.customer, "customer");
    const workerWallet = await getWallet(job.assignedWorker, "worker");
    const grossAmount = Number(job.grossAmount || job.finalPrice || 0);
    const commissionAmount = Number(job.platformFee || (grossAmount * COMMISSION_RATE)).toFixed(2);
    const workerPayout = Number(job.workerPayout || (grossAmount - Number(commissionAmount))).toFixed(2);

    customerWallet.heldBalance = Math.max(0, Number((customerWallet.heldBalance - grossAmount).toFixed(2)));
    await customerWallet.save();
    await recordTransaction({ wallet: customerWallet, type: "escrow_release", amount: grossAmount, job: job._id, description: "Escrow released after job completion" });

    workerWallet.balance = Number((workerWallet.balance + Number(workerPayout)).toFixed(2));
    await workerWallet.save();
    await recordTransaction({ wallet: workerWallet, type: "payout", amount: Number(workerPayout), job: job._id, description: "Worker payout after platform commission" });
    await recordTransaction({ wallet: workerWallet, type: "commission", amount: Number(commissionAmount), job: job._id, description: "Platform commission deducted" });

    job.escrowStatus = "released";
    job.escrowReleasedAt = new Date();
    await job.save();
    return { grossAmount, commissionAmount: Number(commissionAmount), workerPayout: Number(workerPayout) };
};

const topUpWallet = async ({ owner, ownerRole, amount }) => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 200000) {
        throw new Error("Top-up amount must be between ₹1 and ₹2,00,000");
    }
    const wallet = await getWallet(owner, ownerRole);
    wallet.balance = Number((wallet.balance + value).toFixed(2));
    await wallet.save();
    await recordTransaction({ wallet, type: "top_up", amount: value, description: "Sandbox wallet top-up" });
    return wallet;
};

module.exports = {
    COMMISSION_RATE,
    getWallet,
    topUpWallet,
    holdJobPayment,
    releaseJobEscrow
};
