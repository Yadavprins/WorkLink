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