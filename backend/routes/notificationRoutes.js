const express = require("express");

const {
    getMyNotifications,
    markAsRead,
    markAllAsRead
} = require("../controllers/notificationController");

const {
    protect
} = require("../middleware/authMiddleware");
const { registerDeviceToken } = require("../controllers/deviceController");

const router = express.Router();

router.post("/device-token", protect, registerDeviceToken);


// Get notifications
router.get(
    "/",
    protect,
    getMyNotifications
);


// Mark all as read
router.patch(
    "/read-all",
    protect,
    markAllAsRead
);


// Mark single notification as read
router.patch(
    "/:notificationId/read",
    protect,
    markAsRead
);


module.exports = router;