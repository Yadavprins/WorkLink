const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "ownerRole",
            unique: true
        },
        ownerRole: {
            type: String,
            enum: ["customer", "worker"],
            required: true
        },
        balance: {
            type: Number,
            default: 0,
            min: 0
        },
        heldBalance: {
            type: Number,
            default: 0,
            min: 0
        },
        currency: {
            type: String,
            default: "INR",
            enum: ["INR"]
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
