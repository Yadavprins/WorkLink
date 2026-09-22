require("dotenv").config();

const bcrypt = require("bcryptjs");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");
const Category = require("./models/Category");
const { DEFAULT_CATEGORIES } = require("./utils/skillMap");
const Job = require("./models/Job");
const { setIO } = require("./services/realtimeService");

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) : true
    }
});

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = { id: decoded.id, role: decoded.role };
        return next();
    } catch (error) {
        return next(new Error("Authentication required"));
    }
});

io.on("connection", (socket) => {
    socket.on("job:join", async (jobId, acknowledge = () => {}) => {
        const participantQuery = socket.user.role === "customer"
            ? { customer: socket.user.id }
            : { assignedWorker: socket.user.id };
        const job = await Job.findOne({ _id: jobId, ...participantQuery });

        if (!job) {
            return acknowledge({ success: false, message: "Job not found" });
        }

        socket.join(`job:${job._id}`);
        acknowledge({ success: true });
    });

    ["call:offer", "call:answer", "call:ice-candidate", "call:end"].forEach((event) => {
        socket.on(event, (payload = {}) => {
            socket.to(`job:${payload.jobId}`).emit(event, {
                ...payload,
                from: socket.user.id
            });
        });
    });
});

setIO(io);

const seedV1Defaults = async () => {
    const adminEmail = String(
        process.env.ADMIN_EMAIL || "admin@nexserve.local"
    )
        .trim()
        .toLowerCase();

    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await Admin.create({
            name: "NexServe Admin",
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
        });

        console.log(`V1 admin seeded: ${adminEmail}`);
    }

    const categoryCount = await Category.countDocuments();

    if (categoryCount === 0) {
        await Category.insertMany(DEFAULT_CATEGORIES);
        console.log("V1 service categories seeded");
    }
};

const startServer = async () => {
    try {
        await connectDB();
        await seedV1Defaults();

        httpServer.listen(PORT, () => {
            console.log(
                `NexServe server is running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Server startup failed:",
            error
        );
        process.exit(1);
    }
};

startServer();
