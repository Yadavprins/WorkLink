const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        recipientRole: {
            type: String,
            enum: [
                "customer",
                "worker"
            ],
            required: true
        },

        type: {
            type: String,
            enum: [
                "job_created",
                "job_available",
                "job_accepted",
                "worker_on_the_way",
                "otp_verified",
                "final_price",
                "payment",
                "job_completed",
                "job_cancelled",
                "sos_alert",
                "general"
            ],
            default: "general"
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);