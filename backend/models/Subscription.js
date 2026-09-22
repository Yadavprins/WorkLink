const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "ownerRole" },
    ownerRole: { type: String, enum: ["customer", "worker"], required: true },
    plan: { type: String, enum: ["basic", "pro", "business"], required: true },
    status: { type: String, enum: ["active", "cancelled", "expired"], default: "active" },
    monthlyPrice: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, default: Date.now },
    renewsAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
