const User = require("../models/User");
const Worker = require("../models/Worker");
const Job = require("../models/Job");
const Category = require("../models/Category");
const { DEFAULT_CATEGORIES } = require("../utils/skillMap");
const debugLog = require("../utils/debugLog");

const getDashboard = async (req, res) => {
    try {
        const [customers, workers, jobs, completed] = await Promise.all([
            User.countDocuments(),
            Worker.countDocuments(),
            Job.countDocuments(),
            Job.countDocuments({ status: "completed" }),
        ]);

        const recentJobs = await Job.find()
            .populate("customer", "name")
            .populate("assignedWorker", "name")
            .sort({ createdAt: -1 })
            .limit(8);

        return res.status(200).json({
            success: true,
            stats: {
                customers,
                workers,
                jobs,
                completed,
            },
            recentJobs,
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load admin dashboard",
        });
    }
};

const getUsers = async (req, res) => {
    try {
        const customers = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        const workers = await Worker.find()
            .select("-password")
            .sort({ createdAt: -1 });

        const people = [
            ...customers.map((user) => ({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: "Customer",
                status: user.isBlocked ? "Blocked" : "Active",
                joined: user.createdAt,
                city: user.city,
            })),
            ...workers.map((worker) => ({
                id: worker._id,
                name: worker.name,
                email: worker.email,
                phone: worker.phone,
                role: "Worker",
                status: worker.isBlocked ? "Blocked" : "Active",
                joined: worker.createdAt,
                city: worker.city,
            })),
        ];

        return res.status(200).json({
            success: true,
            users: people,
        });
    } catch (error) {
        console.error("Admin users error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load users",
        });
    }
};

const toggleUserBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, blocked } = req.body || {};
        const isBlocked = Boolean(blocked);

        if (role === "Worker") {
            const worker = await Worker.findByIdAndUpdate(
                id,
                { $set: { isBlocked, isAvailable: isBlocked ? false : undefined } },
                { new: true }
            ).select("-password");

            if (!worker) {
                return res.status(404).json({
                    success: false,
                    message: "Worker not found",
                });
            }

            if (isBlocked) {
                worker.isAvailable = false;
                await worker.save();
            }

            return res.status(200).json({
                success: true,
                user: {
                    id: worker._id,
                    role: "Worker",
                    status: worker.isBlocked ? "Blocked" : "Active",
                },
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: { isBlocked } },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                role: "Customer",
                status: user.isBlocked ? "Blocked" : "Active",
            },
        });
    } catch (error) {
        console.error("Admin block error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update account status",
        });
    }
};

const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate("customer", "name")
            .populate("assignedWorker", "name")
            .sort({ createdAt: -1 })
            .limit(200);

        return res.status(200).json({
            success: true,
            jobs: jobs.map((job) => ({
                id: job._id,
                title: job.title,
                customer: job.customer?.name || "Customer",
                worker: job.assignedWorker?.name || "Not Assigned",
                category: job.category,
                location: [job.area, job.city].filter(Boolean).join(", "),
                amount: job.finalPrice || job.workerQuote || job.estimatedMaxPrice || 0,
                status: job.status,
                date: job.createdAt,
                latitude: job.location?.latitude,
                longitude: job.location?.longitude,
            })),
        });
    } catch (error) {
        console.error("Admin jobs error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load jobs",
        });
    }
};

const getMapPins = async (req, res) => {
    try {
        const jobs = await Job.find({
            "location.latitude": { $ne: null },
            "location.longitude": { $ne: null },
        })
            .select("title status city area location")
            .limit(200);

        const workers = await Worker.find({
            "location.latitude": { $ne: null },
            "location.longitude": { $ne: null },
        })
            .select("name city area location isAvailable")
            .limit(200);

        // #region agent log
        debugLog(
            "adminController.js:getMapPins",
            "Loaded map pins",
            { jobPins: jobs.length, workerPins: workers.length },
            "C"
        );
        // #endregion

        return res.status(200).json({
            success: true,
            jobs,
            workers,
        });
    } catch (error) {
        console.error("Admin map pins error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load map pins",
        });
    }
};

const getCategories = async (req, res) => {
    try {
        let categories = await Category.find().sort({ name: 1 });

        if (categories.length === 0) {
            await Category.insertMany(DEFAULT_CATEGORIES);
            categories = await Category.find().sort({ name: 1 });
        }

        return res.status(200).json({
            success: true,
            categories,
        });
    } catch (error) {
        console.error("Get categories error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load categories",
        });
    }
};

const createCategory = async (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const skill = String(req.body?.skill || "").trim();

        if (!name || !skill) {
            return res.status(400).json({
                success: false,
                message: "Category name and skill are required",
            });
        }

        const category = await Category.create({ name, skill, isActive: true });

        return res.status(201).json({
            success: true,
            category,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Category already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create category",
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const updates = {};

        if (req.body?.name) updates.name = String(req.body.name).trim();
        if (req.body?.skill) updates.skill = String(req.body.skill).trim();
        if (req.body?.isActive !== undefined) {
            updates.isActive = Boolean(req.body.isActive);
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        return res.status(200).json({
            success: true,
            category,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update category",
        });
    }
};

module.exports = {
    getDashboard,
    getUsers,
    toggleUserBlock,
    getJobs,
    getMapPins,
    getCategories,
    createCategory,
    updateCategory,
};
