const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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
            unique: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

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

        location: {
            latitude: {
                type: Number,
                default: null
            },

            longitude: {
                type: Number,
                default: null
            }
        },

        profileImage: {
            type: String,
            default: ""
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

        favoriteWorkers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker"
        }],

        accountType: {
            type: String,
            enum: ["individual", "business"],
            default: "individual"
        },

        businessAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "B2BAccount",
            default: null
        },

        referralCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },

        role: {
            type: String,
            default: "customer",
            enum: ["customer"]
        },

        isBlocked: {
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
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);