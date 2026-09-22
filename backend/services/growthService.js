const PromoCode = require("../models/PromoCode");
const Referral = require("../models/Referral");
const WalletTransaction = require("../models/WalletTransaction");

const getPromoDiscount = async ({ code, amount, city }) => {
    if (!code) return { discount: 0, promo: null };
    const promo = await PromoCode.findOne({ code: String(code).trim().toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
    if (!promo) throw new Error("Promo code is invalid or expired");
    if (Number(amount) < promo.minimumOrder) throw new Error(`Minimum order for this promo is ₹${promo.minimumOrder}`);
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) throw new Error("Promo code usage limit reached");
    if (promo.cities.length && !promo.cities.some((item) => item.toLowerCase() === String(city).toLowerCase())) throw new Error("Promo code is not available in this city");
    let discount = promo.discountType === "percent" ? Number(amount) * promo.discountValue / 100 : promo.discountValue;
    if (promo.maxDiscount !== null) discount = Math.min(discount, promo.maxDiscount);
    return { discount: Number(Math.min(discount, Number(amount)).toFixed(2)), promo };
};

const rewardReferral = async (userId) => {
    const { getWallet } = require("./paymentService");
    const referral = await Referral.findOne({ referred: userId, status: "pending" });
    if (!referral) return null;
    const wallet = await getWallet(referral.referrer, "customer");
    wallet.balance = Number((wallet.balance + referral.rewardAmount).toFixed(2));
    await wallet.save();
    await WalletTransaction.create({ wallet: wallet._id, owner: wallet.owner, ownerRole: "customer", type: "top_up", amount: referral.rewardAmount, reference: `REFERRAL_${Date.now()}`, description: "Referral reward" });
    referral.status = "rewarded";
    referral.rewardedAt = new Date();
    await referral.save();
    return referral;
};

module.exports = { getPromoDiscount, rewardReferral };
