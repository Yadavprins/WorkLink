const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
    getMyWallet,
    addWalletFunds,
    payForJob,
    releasePayment
} = require("../controllers/paymentController");

const router = express.Router();

router.get("/wallet", protect, authorize("customer", "worker"), getMyWallet);
router.post("/wallet/top-up", protect, authorize("customer", "worker"), addWalletFunds);
router.post("/jobs/:jobId/pay", protect, authorize("customer"), payForJob);
router.post("/jobs/:jobId/release", protect, authorize("customer"), releasePayment);

module.exports = router;
