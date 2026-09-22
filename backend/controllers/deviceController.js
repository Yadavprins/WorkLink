const User = require("../models/User");
const Worker = require("../models/Worker");

const registerDeviceToken = async (req, res) => {
    const token = String(req.body?.token || "").trim();

    if (!token) {
        return res.status(400).json({ success: false, message: "FCM token is required" });
    }

    const Model = req.user.role === "worker" ? Worker : User;
    const account = await Model.findByIdAndUpdate(req.user.id, { fcmToken: token }, { new: true });

    if (!account) {
        return res.status(404).json({ success: false, message: "Account not found" });
    }

    return res.status(200).json({ success: true, message: "Device registered" });
};

module.exports = { registerDeviceToken };
