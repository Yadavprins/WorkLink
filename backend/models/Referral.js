const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referred: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    status: { type: String, enum: ["pending", "qualified", "rewarded"], default: "pending" },
    rewardAmount: { type: Number, default: 100, min: 0 },
    rewardedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Referral", referralSchema);
