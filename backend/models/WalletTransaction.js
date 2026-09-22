const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
    {
        wallet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wallet",
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        ownerRole: {
            type: String,
            enum: ["customer", "worker"],
            required: true
        },
        type: {
            type: String,
            enum: ["top_up", "escrow_hold", "escrow_release", "commission", "refund", "payout"],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            default: null
        },
        reference: {
            type: String,
            required: true,
            unique: true
        },
        description: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
