require("dotenv").config();

const bcrypt = require("bcryptjs");

const app = require("./app");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");
const Category = require("./models/Category");
const { DEFAULT_CATEGORIES } = require("./utils/skillMap");

const PORT = process.env.PORT || 5000;

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

        app.listen(PORT, () => {
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
