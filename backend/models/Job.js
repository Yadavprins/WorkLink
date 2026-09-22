const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        // ==================================================
        // CUSTOMER
        // ==================================================

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        // ==================================================
        // JOB DETAILS
        // ==================================================

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        requiredSkill: {
            type: String,
            required: true,
            trim: true
        },

        difficulty: {
            type: String,
            enum: [
                "Easy",
                "Medium",
                "Hard"
            ],
            default: "Medium"
        },

        image: {
            type: String,
            default: ""
        },

        aiRiskScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 1
        },

        aiRiskSignals: {
            type: [String],
            default: []
        },

        imageAnalysis: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        scheduledAt: {
            type: Date,
            default: null
        },

        isEmergency: {
            type: Boolean,
            default: false
        },

        repeatOf: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            default: null
        },

        businessAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "B2BAccount",
            default: null
        },


        // ==================================================
        // LOCATION
        // ==================================================

        city: {
            type: String,
            required: true,
            trim: true
        },

        area: {
            type: String,
            required: true,
            trim: true
        },

        address: {
            type: String,
            default: "",
            trim: true
        },

        location: {
            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            }
        },

        workerLiveLocation: {
            latitude: {
                type: Number,
                default: null
            },
            longitude: {
                type: Number,
                default: null
            },
            updatedAt: {
                type: Date,
                default: null
            }
        },

        liveTrackingActive: {
            type: Boolean,
            default: false
        },


        // ==================================================
        // JOB PREFERENCES
        // ==================================================

        urgency: {
            type: String,
            enum: [
                "normal",
                "urgent"
            ],
            default: "normal"
        },

        bookingType: {
            type: String,
            enum: [
                "instant",
                "quote"
            ],
            required: true
        },


        // ==================================================
        // PRICE
        // ==================================================

        estimatedMinPrice: {
            type: Number,
            default: 0,
            min: 0
        },

        estimatedMaxPrice: {
            type: Number,
            default: 0,
            min: 0
        },

        finalPrice: {
            type: Number,
            default: 0,
            min: 0
        },

        platformFee: {
            type: Number,
            default: 0,
            min: 0
        },

        grossAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        workerPayout: {
            type: Number,
            default: 0,
            min: 0
        },

        discount: {
            type: Number,
            default: 0,
            min: 0
        },

        promoCode: { type: String, default: "", trim: true },

        invoiceNumber: {
            type: String,
            default: null,
            trim: true
        },

        completionNotes: {
            type: String,
            default: "",
            trim: true
        },

        completionPhotos: {
            type: [String],
            default: []
        },


        // ==================================================
        // ASSIGNED WORKER
        // ==================================================

        assignedWorker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            default: null
        },

        workerQuote: {
            type: Number,
            default: null,
            min: 0
        },


        // ==================================================
        // OTP
        // ==================================================

        otp: {
            type: String,
            default: null
        },

        otpVerified: {
            type: Boolean,
            default: false
        },


        // ==================================================
        // PAYMENT
        // MINI PROJECT = FAKE / MOCK PAYMENT
        // ==================================================

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed"
            ],
            default: "pending"
        },

        paymentMethod: {
            type: String,
            enum: [
                "mock",
                "cash",
                "upi",
                "card",
                "wallet"
            ],
            default: "mock"
        },

        escrowStatus: {
            type: String,
            enum: ["none", "held", "released", "refunded"],
            default: "none"
        },

        escrowReleasedAt: {
            type: Date,
            default: null
        },

        transactionId: {
            type: String,
            default: null,
            trim: true
        },

        paidAt: {
            type: Date,
            default: null
        },


        // ==================================================
        // RATING & REVIEW
        // ==================================================

        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },

        review: {
            type: String,
            trim: true,
            default: null
        },

        ratedAt: {
            type: Date,
            default: null
        },

        customerRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },

        customerReview: {
            type: String,
            trim: true,
            default: null
        },

        customerRatedAt: {
            type: Date,
            default: null
        },


        // ==================================================
        // CANCELLATION
        // ==================================================

        cancellationReason: {
            type: String,
            trim: true,
            default: null
        },

        cancelledBy: {
            type: String,
            enum: [
                "customer",
                "worker",
                "system"
            ],
            default: null
        },

        cancelledAt: {
            type: Date,
            default: null
        },

        arrivedAt: {
            type: Date,
            default: null
        },

        startedAt: {
            type: Date,
            default: null
        },


        // ==================================================
        // JOB STATUS
        // ==================================================

        status: {
            type: String,
            enum: [
                "posted",
                "searching",
                "no_worker_found",
                "accepted",
                "on_the_way",
                "arrived",
                "otp_verified",
                "in_progress",
                "completed",
                "cancelled"
            ],
            default: "posted"
        }
    },

    {
        timestamps: true
    }
);


// ======================================================
// MODEL
// ======================================================

module.exports = mongoose.model(
    "Job",
    jobSchema
);