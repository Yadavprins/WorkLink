const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const workerRoutes = require("./routes/workerRoutes");
const jobRoutes = require("./routes/jobRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const customerRoutes = require("./routes/customerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const customerFeatureRoutes = require("./routes/customerFeatureRoutes");
const safetyRoutes = require("./routes/safetyRoutes");
const growthRoutes = require("./routes/growthRoutes");

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
    : null;

app.use(cors({
    origin: allowedOrigins || true
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "NexServe API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/customer-features", customerFeatureRoutes);
app.use("/api/safety", safetyRoutes);
app.use("/api/growth", growthRoutes);

// Centralized 404 response
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// Centralized error response
app.use((err, req, res, next) => {
    console.error("Unhandled API error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

module.exports = app;
