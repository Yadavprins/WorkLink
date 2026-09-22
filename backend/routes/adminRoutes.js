const express = require("express");

const {
    getDashboard,
    getUsers,
    toggleUserBlock,
    getJobs,
    getMapPins,
    getCategories,
    createCategory,
    updateCategory,
} = require("../controllers/adminController");

const { protect, authorize } = require("../middleware/authMiddleware");
const { getDemandHeatmap, getFraudReview, getSOSAlerts } = require("../controllers/adminSafetyController");
const { getRevenueDashboard, getCityControls, updateCityControls, createPromo, featureWorker } = require("../controllers/adminGrowthController");

const router = express.Router();

router.get("/categories", getCategories);

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.patch("/users/:id/block", toggleUserBlock);
router.get("/jobs", getJobs);
router.get("/map-pins", getMapPins);
router.get("/demand-heatmap", getDemandHeatmap);
router.get("/fraud-review", getFraudReview);
router.get("/sos-alerts", getSOSAlerts);
router.get("/revenue", getRevenueDashboard);
router.get("/city-controls", getCityControls);
router.patch("/city-controls/:city", updateCityControls);
router.post("/promo-codes", createPromo);
router.patch("/workers/:workerId/featured", featureWorker);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);

module.exports = router;
