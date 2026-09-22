const Worker = require("../models/Worker");
const { calculateTrustScore, getTrustBadges } = require("../services/trustScoreService");

const sanitizeCertificates = (items) => (Array.isArray(items) ? items : []).slice(0, 20).map((item) => ({
    title: String(item?.title || "").trim().slice(0, 120),
    issuer: String(item?.issuer || "").trim().slice(0, 120),
    issuedYear: Number(item?.issuedYear) || undefined,
    documentUrl: String(item?.documentUrl || "").trim().slice(0, 500),
    status: "pending"
})).filter((item) => item.title && item.issuer);

const sanitizePortfolio = (items) => (Array.isArray(items) ? items : []).slice(0, 30).map((item) => ({
    title: String(item?.title || "").trim().slice(0, 120),
    description: String(item?.description || "").trim().slice(0, 500),
    beforeImage: String(item?.beforeImage || "").trim().slice(0, 500),
    afterImage: String(item?.afterImage || "").trim().slice(0, 500)
})).filter((item) => item.title && (item.beforeImage || item.afterImage));

const submitVerification = async (req, res) => {
    try {
        const worker = await Worker.findById(req.user.id);
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        worker.certificates = sanitizeCertificates(req.body?.certificates);
        worker.portfolio = sanitizePortfolio(req.body?.portfolio);
        worker.verificationStatus = "pending";
        worker.verificationNotes = "";
        worker.verificationSubmittedAt = new Date();
        await worker.save();

        return res.status(200).json({ success: true, message: "Verification submitted for review", worker });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getVerificationQueue = async (req, res) => {
    try {
        const workers = await Worker.find({ verificationStatus: { $in: ["pending", "approved", "rejected"] } })
            .select("-password -fcmToken")
            .sort({ verificationSubmittedAt: -1 });
        return res.status(200).json({ success: true, workers });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to load verification queue" });
    }
};

const updateVerification = async (req, res) => {
    try {
        const status = String(req.body?.status || "").toLowerCase();
        if (!["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid verification status" });
        }

        const worker = await Worker.findById(req.params.workerId);
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        worker.verificationStatus = status;
        worker.verificationNotes = String(req.body?.notes || "").trim().slice(0, 1000);
        worker.verifiedAt = status === "approved" ? new Date() : null;
        worker.certificates = worker.certificates.map((certificate) => ({
            ...certificate.toObject(),
            status: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending"
        }));
        worker.trustScore = calculateTrustScore(worker);
        worker.badges = getTrustBadges(worker);
        await worker.save();

        return res.status(200).json({ success: true, message: `Worker verification ${status}`, worker });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = { submitVerification, getVerificationQueue, updateVerification };
