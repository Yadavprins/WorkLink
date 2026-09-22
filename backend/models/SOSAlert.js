const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    raisedByRole: { type: String, enum: ["customer", "worker"], required: true },
    location: {
        latitude: { type: Number, min: -90, max: 90, default: null },
        longitude: { type: Number, min: -180, max: 180, default: null }
    },
    message: { type: String, trim: true, maxlength: 500, default: "Emergency assistance requested" },
    status: { type: String, enum: ["active", "acknowledged", "resolved"], default: "active" },
    resolvedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
