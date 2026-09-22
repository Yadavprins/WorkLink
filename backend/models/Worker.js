const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
    {
        latitude: {
            type: Number,
            min: -90,
            max: 90,
            default: null
        },

        longitude: {
            type: Number,
            min: -180,
            max: 180,
            default: null
        },

        updatedAt: {
            type: Date,
            default: null
        }
    },
    {
        _id: false
    }
);

const workerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        /*
         * IMPORTANT:
         * city = registered district.
         *
         * District can be changed ONLY ONCE.
         * After first district change:
         * districtChangeUsed = true
         */
        city: {
            type: String,
            required: true,
            trim: true
        },

        districtChangeUsed: {
            type: Boolean,
            default: false
        },

        /*
         * Area/address is freely editable.
         */
        area: {
            type: String,
            required: true,
            trim: true
        },

        skills: {
            type: [String],
            default: []
        },

        experience: {
            type: Number,
            default: 0,
            min: 0
        },

        certificates: {
            type: [{
                title: { type: String, trim: true },
                issuer: { type: String, trim: true },
                issuedYear: { type: Number, min: 1900, max: 2100 },
                documentUrl: { type: String, trim: true },
                status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
            }],
            default: []
        },

        portfolio: {
            type: [{
                title: { type: String, trim: true },
                description: { type: String, trim: true },
                beforeImage: { type: String, trim: true },
                afterImage: { type: String, trim: true }
            }],
            default: []
        },

        verificationStatus: {
            type: String,
            enum: ["not_submitted", "pending", "approved", "rejected"],
            default: "not_submitted"
        },

        verificationNotes: {
            type: String,
            default: "",
            trim: true
        },

        verificationSubmittedAt: {
            type: Date,
            default: null
        },

        verifiedAt: {
            type: Date,
            default: null
        },

        trustScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        badges: {
            type: [String],
            default: []
        },

        featuredUntil: { type: Date, default: null },
        featuredCity: { type: String, default: "", trim: true },

        /*
         * Current GPS location.
         *
         * This is NOT used to change district.
         * It is only used for actual distance matching.
         */
        location: {
            type: locationSchema,
            default: () => ({
                latitude: null,
                longitude: null,
                updatedAt: null
            })
        },

        role: {
            type: String,
            default: "worker",
            enum: ["worker"]
        },

        fcmToken: {
            type: String,
            default: "",
            select: false
        },

        deviceId: { type: String, default: "", select: false },
        deviceVerified: { type: Boolean, default: false },
        lastDeviceCheckAt: { type: Date, default: null },
        gpsVerified: { type: Boolean, default: false },
        gpsAccuracy: { type: Number, default: null, min: 0 },

        isBlocked: {
            type: Boolean,
            default: false
        },

        isAvailable: {
            type: Boolean,
            default: false
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        totalRatings: {
            type: Number,
            default: 0,
            min: 0
        },

        acceptedJobs: {
            type: Number,
            default: 0,
            min: 0
        },

        completedJobs: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model("Worker", workerSchema);