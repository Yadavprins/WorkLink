const express = require("express");
const { getMessages, createMessage } = require("../controllers/messageController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
const participant = ["customer", "worker"];

router.get("/:jobId", protect, authorize(...participant), getMessages);
router.post("/:jobId", protect, authorize(...participant), createMessage);

module.exports = router;
