const mongoose = require("mongoose");
const User = require("../models/User");
const Worker = require("../models/Worker");
const Job = require("../models/Job");
const SOSAlert = require("../models/SOSAlert");
const { emitToJob, getIO } = require("../services/realtimeService");
const { createNotification } = require("../services/notificationService");

const verifyDeviceAndGPS = async (req, res) => {
    try {
        const deviceId = String(req.body?.deviceId || "").trim();
        const latitude = Number(req.body?.latitude);
        const longitude = Number(req.body?.longitude);
        const accuracy = Number(req.body?.accuracy);
        if (!deviceId || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ success: false, message: "Device ID and valid GPS coordinates are required" });
        }

        const Model = req.user.role === "worker" ? Worker : User;
        const account = await Model.findByIdAndUpdate(req.user.id, {
            deviceId,
            deviceVerified: true,
            lastDeviceCheckAt: new Date(),
            gpsVerified: Number.isFinite(accuracy) ? accuracy <= 100 : true,
            gpsAccuracy: Number.isFinite(accuracy) ? accuracy : null,
            location: { latitude, longitude, updatedAt: new Date() }
        }, { new: true }).select("-password -fcmToken -deviceId");

        if (!account) return res.status(404).json({ success: false, message: "Account not found" });
        return res.status(200).json({ success: true, message: "Device and GPS verified", verification: {
            deviceVerified: account.deviceVerified,
            gpsVerified: account.gpsVerified,
            gpsAccuracy: account.gpsAccuracy,
            checkedAt: account.lastDeviceCheckAt
        } });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to verify device and GPS" });
    }
};

const raiseSOS = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.jobId)) return res.status(400).json({ success: false, message: "Invalid job ID" });
        const participantQuery = req.user.role === "customer" ? { customer: req.user.id } : { assignedWorker: req.user.id };
        const job = await Job.findOne({ _id: req.params.jobId, ...participantQuery });
        if (!job) return res.status(404).json({ success: false, message: "Job not found" });

        const alert = await SOSAlert.create({
            job: job._id,
            raisedBy: req.user.id,
            raisedByRole: req.user.role,
            location: {
                latitude: Number(req.body?.latitude) || null,
                longitude: Number(req.body?.longitude) || null
            },
            message: String(req.body?.message || "Emergency assistance requested").trim().slice(0, 500)
        });
        emitToJob(job._id, "sos:alert", alert);
        const otherParticipant = req.user.role === "customer" ? job.assignedWorker : job.customer;
        const otherRole = req.user.role === "customer" ? "worker" : "customer";
        if (otherParticipant) await createNotification({ recipient: otherParticipant, recipientRole: otherRole, type: "sos_alert", title: "SOS Emergency Alert", message: "Emergency assistance was requested for an active job.", job: job._id });
        getIO()?.emit("sos:admin-alert", alert);
        return res.status(201).json({ success: true, message: "SOS alert raised", alert });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to raise SOS alert" });
    }
};

const resolveSOS = async (req, res) => {
    const alert = await SOSAlert.findByIdAndUpdate(req.params.alertId, { status: "resolved", resolvedAt: new Date() }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: "SOS alert not found" });
    emitToJob(alert.job, "sos:resolved", alert);
    return res.status(200).json({ success: true, alert });
};

module.exports = { verifyDeviceAndGPS, raiseSOS, resolveSOS };
