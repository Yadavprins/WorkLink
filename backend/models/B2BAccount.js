const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null }
}, { _id: true });

const b2bAccountSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    organizationType: { type: String, enum: ["society", "hotel", "office"], required: true },
    organizationName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    sites: { type: [siteSchema], default: [] },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("B2BAccount", b2bAccountSchema);
