const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { verifyDeviceAndGPS, raiseSOS, resolveSOS } = require("../controllers/safetyController");

const router = express.Router();
router.post("/device-gps", protect, authorize("customer", "worker"), verifyDeviceAndGPS);
router.post("/jobs/:jobId/sos", protect, authorize("customer", "worker"), raiseSOS);
router.patch("/sos/:alertId/resolve", protect, authorize("customer", "worker", "admin"), resolveSOS);

module.exports = router;
