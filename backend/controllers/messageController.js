const mongoose = require("mongoose");
const Job = require("../models/Job");
const Message = require("../models/Message");
const { emitToJob } = require("../services/realtimeService");

const getParticipantJob = async (jobId, user) => {
    if (!mongoose.isValidObjectId(jobId)) {
        return null;
    }

    const participantQuery = user.role === "customer"
        ? { customer: user.id }
        : { assignedWorker: user.id };

    return Job.findOne({ _id: jobId, ...participantQuery });
};

const getMessages = async (req, res) => {
    try {
        const job = await getParticipantJob(req.params.jobId, req.user);

        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        const messages = await Message.find({ job: job._id })
            .sort({ createdAt: 1 })
            .limit(200)
            .populate("sender", "name");

        return res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error("Get messages error:", error);
        return res.status(500).json({ success: false, message: "Unable to load messages" });
    }
};

const createMessage = async (req, res) => {
    try {
        const text = String(req.body?.text || "").trim();
        const job = await getParticipantJob(req.params.jobId, req.user);

        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        if (!text || text.length > 2000) {
            return res.status(400).json({ success: false, message: "Message must be between 1 and 2000 characters" });
        }

        const message = await Message.create({
            job: job._id,
            sender: req.user.id,
            senderRole: req.user.role,
            text
        });

        const populatedMessage = await message.populate("sender", "name");
        emitToJob(job._id, "chat:message", populatedMessage);

        return res.status(201).json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error("Create message error:", error);
        return res.status(500).json({ success: false, message: "Unable to send message" });
    }
};

module.exports = {
    getParticipantJob,
    getMessages,
    createMessage
};
