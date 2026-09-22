const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
    toggleFavoriteWorker,
    getFavoriteWorkers,
    getScheduledBookings,
    repeatBooking,
    createB2BAccount,
    getB2BAccount
} = require("../controllers/customerFeatureController");

const router = express.Router();
router.use(protect, authorize("customer"));

router.get("/favorites", getFavoriteWorkers);
router.patch("/favorites/:workerId", toggleFavoriteWorker);
router.get("/scheduled-bookings", getScheduledBookings);
router.post("/repeat-booking/:jobId", repeatBooking);
router.get("/business-account", getB2BAccount);
router.post("/business-account", createB2BAccount);

module.exports = router;
