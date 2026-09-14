const Worker = require("../models/Worker");
const Job = require("../models/Job");
const { getRequiredSkill } = require("../utils/skillMap");
const { expireAndFinalizeDispatches } = require("../services/dispatchService");


// ======================================================
// CONSTANTS
// ======================================================

const SERVICE_RADIUS_KM = 5;

const AVAILABLE_JOB_STATUSES = [
    "posted",
    "searching"
];


// ======================================================
// HELPERS
// ======================================================

const normalize = (value) => {
    return String(value || "")
        .trim()
        .toLowerCase();
};


const hasValidCoordinates = (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
};


const getWorkerCoordinates = (worker) => {
    const latitude = worker?.location?.latitude;
    const longitude = worker?.location?.longitude;

    if (!hasValidCoordinates(latitude, longitude)) {
        return null;
    }

    return {
        latitude: Number(latitude),
        longitude: Number(longitude)
    };
};


const getJobCoordinates = (job) => {
    const latitude =
        job?.location?.latitude ??
        job?.latitude;

    const longitude =
        job?.location?.longitude ??
        job?.longitude;

    if (!hasValidCoordinates(latitude, longitude)) {
        return null;
    }

    return {
        latitude: Number(latitude),
        longitude: Number(longitude)
    };
};


// Haversine distance in KM
const calculateDistance = (
    latitude1,
    longitude1,
    latitude2,
    longitude2
) => {
    const toRadians = (degree) => {
        return degree * (Math.PI / 180);
    };

    const earthRadiusKm = 6371;

    const dLat = toRadians(latitude2 - latitude1);
    const dLng = toRadians(longitude2 - longitude1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(latitude1)) *
        Math.cos(toRadians(latitude2)) *
        Math.sin(dLng / 2) ** 2;

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadiusKm * c;
};


const getDistanceBetweenWorkerAndJob = (worker, job) => {
    const workerLocation = getWorkerCoordinates(worker);
    const jobLocation = getJobCoordinates(job);

    if (!workerLocation || !jobLocation) {
        return null;
    }

    return calculateDistance(
        workerLocation.latitude,
        workerLocation.longitude,
        jobLocation.latitude,
        jobLocation.longitude
    );
};


const isSameDistrict = (workerCity, jobCity) => {
    return normalize(workerCity) === normalize(jobCity);
};


const isWithinServiceRadius = (distance) => {
    return (
        Number.isFinite(distance) &&
        distance <= SERVICE_RADIUS_KM
    );
};


const getWorkerId = (req) => {
    return req.user?.id || req.user?._id;
};


// ======================================================
// GET WORKER PROFILE
// ======================================================

const getMyProfile = async (req, res) => {
    try {
        const workerId = getWorkerId(req);

        if (!workerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const worker = await Worker.findById(workerId).select("-password");

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        return res.status(200).json({
            success: true,
            worker
        });

    } catch (error) {
        console.error("getMyProfile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch worker profile",
            error: error.message
        });
    }
};


// ======================================================
// UPDATE WORKER PROFILE
// ======================================================

const updateMyProfile = async (req, res) => {
    try {
        const workerId = getWorkerId(req);

        if (!workerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const worker = await Worker.findById(workerId);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        const {
            name,
            phone,
            skills,
            experience
        } = req.body;

        if (
            req.body?.city !== undefined ||
            req.body?.area !== undefined
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Worker address is permanent. Contact Customer Care to request a change."
            });
        }


        // ----------------------------------------------
        // BASIC PROFILE FIELDS
        // ----------------------------------------------

        if (name !== undefined) {
            const value = String(name).trim();

            if (!value) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }

            worker.name = value;
        }


        if (phone !== undefined) {
            const value = String(phone).trim();

            if (!value) {
                return res.status(400).json({
                    success: false,
                    message: "Phone cannot be empty"
                });
            }

            worker.phone = value;
        }


        // ----------------------------------------------
        // SKILLS
        // ----------------------------------------------

        if (skills !== undefined) {
            let normalizedSkills = [];

            if (Array.isArray(skills)) {
                normalizedSkills = skills
                    .map((skill) => String(skill).trim())
                    .filter(Boolean);
            } else if (typeof skills === "string") {
                normalizedSkills = skills
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean);
            }

            worker.skills = [
                ...new Set(normalizedSkills)
            ];
        }


        // ----------------------------------------------
        // EXPERIENCE
        // ----------------------------------------------

        if (experience !== undefined) {
            const numericExperience = Number(experience);

            if (
                !Number.isFinite(numericExperience) ||
                numericExperience < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Experience must be a valid non-negative number"
                });
            }

            worker.experience = numericExperience;
        }


        await worker.save();

        const updatedWorker =
            await Worker.findById(worker._id).select("-password");

        return res.status(200).json({
            success: true,
            message: "Worker profile updated successfully",
            worker: updatedWorker
        });

    } catch (error) {
        console.error("updateMyProfile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update worker profile",
            error: error.message
        });
    }
};


// ======================================================
// UPDATE WORKER AVAILABILITY
// ======================================================

const updateAvailability = async (req, res) => {
    try {
        const workerId = getWorkerId(req);

        if (!workerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const { isAvailable } = req.body;

        if (typeof isAvailable !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isAvailable must be true or false"
            });
        }

        const worker = await Worker.findById(workerId);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }


        // Worker can go online only after GPS is available.
        if (isAvailable) {
            const coordinates =
                getWorkerCoordinates(worker);

            if (!coordinates) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please update your current GPS location before going online"
                });
            }
        }


        worker.isAvailable = isAvailable;

        await worker.save();

        await Job.updateOne(
            {
                assignedWorker: worker._id,
                status: {
                    $in: ["on_the_way", "arrived"]
                },
                liveTrackingActive: true
            },
            {
                $set: {
                    workerLiveLocation: {
                        latitude,
                        longitude,
                        updatedAt: new Date()
                    }
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: isAvailable
                ? "Worker is now online"
                : "Worker is now offline",
            worker: {
                id: worker._id,
                isAvailable: worker.isAvailable,
                location: worker.location
            }
        });

    } catch (error) {
        console.error("updateAvailability error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update availability",
            error: error.message
        });
    }
};


// ======================================================
// UPDATE WORKER GPS LOCATION
// ======================================================

const updateLocation = async (req, res) => {
    try {
        const workerId = getWorkerId(req);

        if (!workerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const latitude = Number(req.body?.latitude);
        const longitude = Number(req.body?.longitude);

        if (!hasValidCoordinates(latitude, longitude)) {
            return res.status(400).json({
                success: false,
                message:
                    "Latitude and longitude must be valid numbers"
            });
        }

        const worker = await Worker.findById(workerId);

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }

        worker.location = {
            latitude,
            longitude,
            updatedAt: new Date()
        };

        await worker.save();

        return res.status(200).json({
            success: true,
            message: "Worker location updated successfully",
            location: worker.location
        });

    } catch (error) {
        console.error("updateLocation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update worker location",
            error: error.message
        });
    }
};


// ======================================================
// WORKER DASHBOARD
// ======================================================

const getWorkerDashboard = async (req, res) => {
    try {
        const workerId = getWorkerId(req);

        if (!workerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const worker = await Worker.findById(workerId)
            .select("-password");

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }


        const workerLocation =
            getWorkerCoordinates(worker);


        let nearbyJobs = [];

        if (
            worker.isAvailable &&
            workerLocation &&
            Array.isArray(worker.skills) &&
            worker.skills.length > 0
        ) {

            const jobs = await Job.find({
                status: {
                    $in: AVAILABLE_JOB_STATUSES
                },
                assignedWorker: null
            })
                .populate(
                    "customer",
                    "name phone email city area"
                )
                .sort({
                    createdAt: -1
                })
                .limit(100);


            nearbyJobs = jobs
                .filter((job) => {

                    const acceptedSkills = [
                        job.requiredSkill,
                        job.category,
                        getRequiredSkill(job.category, "")
                    ]
                        .filter(Boolean)
                        .map(normalize);

                    const skillMatch =
                        worker.skills.some(
                            (workerSkill) =>
                                acceptedSkills.includes(
                                    normalize(workerSkill)
                                )
                        );

                    if (!skillMatch) {
                        return false;
                    }

                    const distance =
                        getDistanceBetweenWorkerAndJob(
                            worker,
                            job
                        );

                    return isWithinServiceRadius(distance);
                })
                .map((job) => {

                    const distance =
                        getDistanceBetweenWorkerAndJob(
                            worker,
                            job
                        );

                    return {
                        ...job.toObject(),
                        distance: Number(
                            distance.toFixed(2)
                        )
                    };
                })
                .sort(
                    (a, b) =>
                        a.distance - b.distance
                );
        }


        return res.status(200).json({
            success: true,

            worker: {
                id: worker._id,
                name: worker.name,
                city: worker.city,
                area: worker.area,
                skills: worker.skills,
                experience: worker.experience,
                rating: worker.rating,
                acceptedJobs: worker.acceptedJobs,
                completedJobs: worker.completedJobs,
                isAvailable: worker.isAvailable,
                location: worker.location,
                districtChangeUsed:
                    worker.districtChangeUsed
            },

            stats: {
                acceptedJobs:
                    worker.acceptedJobs,
                completedJobs:
                    worker.completedJobs,
                rating:
                    worker.rating
            },

            nearbyJobs
        });

    } catch (error) {
        console.error("getWorkerDashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load worker dashboard",
            error: error.message
        });
    }
};


// ======================================================
// WORKER EARNINGS
// ======================================================

const getWorkerEarnings = async (req, res) => {
    try {
        const workerId = getWorkerId(req);

        if (!workerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const jobs = await Job.find({
            assignedWorker: workerId,
            status: "completed",
            paymentStatus: "paid"
        })
            .select(
                "title category finalPrice paymentStatus transactionId paidAt updatedAt"
            )
            .sort({
                updatedAt: -1
            });


        const totalEarnings = jobs.reduce(
            (total, job) =>
                total + Number(job.finalPrice || 0),
            0
        );


        return res.status(200).json({
            success: true,
            totalEarnings,
            count: jobs.length,
            jobs
        });

    } catch (error) {
        console.error("getWorkerEarnings error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load worker earnings",
            error: error.message
        });
    }
};


// ======================================================
// WORKER JOB SEARCH + FILTERS
// ======================================================

const searchWorkerJobs = async (req, res) => {
    try {
        const workerId = getWorkerId(req);

        if (!workerId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const worker = await Worker.findById(workerId)
            .select("-password");

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            });
        }


        // Worker must be online.
        if (!worker.isAvailable) {
            return res.status(400).json({
                success: false,
                message:
                    "Worker must be online to search nearby jobs",
                jobs: []
            });
        }


        const workerLocation =
            getWorkerCoordinates(worker);

        if (!workerLocation) {
            return res.status(400).json({
                success: false,
                message:
                    "Please update your GPS location first",
                jobs: []
            });
        }


        // --------------------------------------------------
        // QUERY FILTERS
        // --------------------------------------------------

        const {
            skill,
            category,
            urgency,
            minPrice,
            maxPrice,
            status = "posted",
            limit = 50
        } = req.query;


        const query = {
            status: {
                $in: AVAILABLE_JOB_STATUSES
            },
            assignedWorker: null
        };


        // Status filter
        if (
            status &&
            AVAILABLE_JOB_STATUSES.includes(
                String(status).toLowerCase()
            )
        ) {
            query.status = String(status).toLowerCase();
        }


        // Skill filter
        if (skill) {
            query.$or = [
                {
                    requiredSkill: {
                        $regex: String(skill),
                        $options: "i"
                    }
                },
                {
                    category: {
                        $regex: String(skill),
                        $options: "i"
                    }
                }
            ];
        }


        // Category filter
        if (category) {
            query.category = {
                $regex: String(category),
                $options: "i"
            };
        }


        // Urgency filter
        if (urgency) {
            query.urgency = {
                $regex: String(urgency),
                $options: "i"
            };
        }


        // Price filter
        const minimumPrice = Number(minPrice);
        const maximumPrice = Number(maxPrice);

        if (
            Number.isFinite(minimumPrice) ||
            Number.isFinite(maximumPrice)
        ) {

            query.$and = [];

            if (Number.isFinite(minimumPrice)) {
                query.$and.push({
                    $or: [
                        {
                            estimatedMinPrice: {
                                $gte: minimumPrice
                            }
                        },
                        {
                            "estimatedPrice.min": {
                                $gte: minimumPrice
                            }
                        }
                    ]
                });
            }

            if (Number.isFinite(maximumPrice)) {
                query.$and.push({
                    $or: [
                        {
                            estimatedMaxPrice: {
                                $lte: maximumPrice
                            }
                        },
                        {
                            "estimatedPrice.max": {
                                $lte: maximumPrice
                            }
                        }
                    ]
                });
            }
        }


        const parsedLimit = Math.min(
            Math.max(Number(limit) || 50, 1),
            100
        );


        const jobs = await Job.find(query)
            .populate(
                "customer",
                "name phone email city area"
            )
            .sort({
                createdAt: -1
            })
            .limit(parsedLimit);

        await Promise.all(
            jobs.map((job) => expireAndFinalizeDispatches(job._id))
        );


        // --------------------------------------------------
        // ACTUAL GPS DISTANCE + WORKER SKILL MATCH
        // --------------------------------------------------

        const filteredJobs = jobs
            .filter((job) => {

                const jobSkill =
                    job.requiredSkill ||
                    job.category;

                const acceptedSkills = [
                    job.requiredSkill,
                    job.category,
                    getRequiredSkill(job.category, "")
                ]
                    .filter(Boolean)
                    .map(normalize);

                const workerHasSkill =
                    Array.isArray(worker.skills) &&
                    worker.skills.some(
                        (workerSkill) =>
                            acceptedSkills.includes(
                                normalize(workerSkill)
                            )
                    );

                if (!workerHasSkill) {
                    return false;
                }


                const distance =
                    getDistanceBetweenWorkerAndJob(
                        worker,
                        job
                    );

                return isWithinServiceRadius(distance);
            })
            .map((job) => {

                const distance =
                    getDistanceBetweenWorkerAndJob(
                        worker,
                        job
                    );

                return {
                    ...job.toObject(),
                    distance: Number(
                        distance.toFixed(2)
                    )
                };
            })
            .sort(
                (a, b) =>
                    a.distance - b.distance
            );


        return res.status(200).json({
            success: true,
            count: filteredJobs.length,
            radiusKm: SERVICE_RADIUS_KM,
            jobs: filteredJobs
        });

    } catch (error) {
        console.error("searchWorkerJobs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search worker jobs",
            error: error.message
        });
    }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    getMyProfile,
    updateMyProfile,
    updateAvailability,
    updateLocation,
    getWorkerDashboard,
    getWorkerEarnings,
    searchWorkerJobs
};