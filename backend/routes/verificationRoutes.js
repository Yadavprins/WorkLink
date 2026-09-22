const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
    submitVerification,
    getVerificationQueue,
    updateVerification
} = require("../controllers/verificationController");

const router = express.Router();

router.post("/submit", protect, authorize("worker"), submitVerification);
router.get("/queue", protect, authorize("admin"), getVerificationQueue);
router.patch("/:workerId", protect, authorize("admin"), updateVerification);

module.exports = router;
