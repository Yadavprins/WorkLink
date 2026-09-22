const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: null, min: 0 },
    minimumOrder: { type: Number, default: 0, min: 0 },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
    cities: { type: [String], default: [] },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("PromoCode", promoCodeSchema);
