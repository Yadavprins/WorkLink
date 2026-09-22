const mongoose = require("mongoose");

const cityConfigSchema = new mongoose.Schema({
    city: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
    commissionRate: { type: Number, min: 0, max: 0.5, default: null },
    emergencyEnabled: { type: Boolean, default: true },
    serviceRadiusKm: { type: Number, min: 1, max: 100, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model("CityConfig", cityConfigSchema);
