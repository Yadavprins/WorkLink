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

const router = express.Router();

router.get("/categories", getCategories);

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.patch("/users/:id/block", toggleUserBlock);
router.get("/jobs", getJobs);
router.get("/map-pins", getMapPins);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);

module.exports = router;
