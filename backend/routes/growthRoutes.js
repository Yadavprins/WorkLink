const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getReferral, applyReferral, validatePromo, subscribe, getSubscription } = require("../controllers/growthController");

const router = express.Router();
router.use(protect, authorize("customer", "worker"));
router.get("/referral", getReferral);
router.post("/referral/apply", authorize("customer"), applyReferral);
router.post("/promo/validate", authorize("customer"), validatePromo);
router.post("/subscription", subscribe);
router.get("/subscription", getSubscription);

module.exports = router;
