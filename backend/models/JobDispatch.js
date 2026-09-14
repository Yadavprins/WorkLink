const mongoose = require("mongoose");

const jobDispatchSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "expired", "cancelled"],
            default: "pending",
        },
        distance: {
            type: Number,
            required: true,
            min: 0,
        },
        radiusRound: {
            type: Number,
            enum: [3, 5, 8],
            required: true,
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        respondedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

jobDispatchSchema.index({ job: 1, worker: 1 }, { unique: true });
jobDispatchSchema.index({ worker: 1, status: 1 });

module.exports = mongoose.model("JobDispatch", jobDispatchSchema);
