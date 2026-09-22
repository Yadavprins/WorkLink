const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
    analyzeDescription,
    estimatePrice,
    inspectImage,
    inspectFakeJob,
    bestWorkerMatches
} = require("../controllers/aiController");

const router = express.Router();

router.post("/predict", protect, authorize("customer", "worker"), analyzeDescription);
router.post("/price-estimate", protect, authorize("customer"), estimatePrice);
router.post("/image-detect", protect, authorize("customer"), inspectImage);
router.post("/fake-job", protect, authorize("customer"), inspectFakeJob);
router.get("/jobs/:jobId/best-workers", protect, authorize("customer"), bestWorkerMatches);

module.exports = router;
