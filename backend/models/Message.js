const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "senderRole",
            required: true,
        },

        senderRole: {
            type: String,
            enum: ["customer", "worker"],
            required: true,
        },

        text: {
            type: String,
            trim: true,
            default: "",
        },

        type: {
            type: String,
            enum: ["text", "voice", "system"],
            default: "text",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Message", messageSchema);
