const mongoose = require("mongoose");

const Job = require("../models/Job");
const Worker = require("../models/Worker");

const {
    calculateDistance
} = require("../services/locationService");

const {
    predictJobDetails
} = require("../services/aiService");

const {
    calculateEstimatedPrice
} = require("../services/priceService");

const generateOTP = require("../utils/generateOTP");
const { getRequiredSkill } = require("../utils/skillMap");
const debugLog = require("../utils/debugLog");

const {
    createNotification
} = require("../services/notificationService");

const {
    dispatchJob,
    expireDispatches,
    expireAndFinalizeDispatches,
    rejectDispatch,
    acceptDispatch
} = require("../services/dispatchService");

// ======================================================
// CONSTANTS
// ======================================================

const SERVICE_RADIUS_KM = 5;

const AVAILABLE_JOB_STATUSES = [
    "posted",
    "searching"
];

const ACTIVE_JOB_STATUSES = [
    "accepted",
    "on_the_way",
    "in_progress"
];

// ======================================================
// SAFE NOTIFICATION HELPER
// ======================================================

const notify = async ({
    recipient,
    recipientRole,
    type,
    title,
    message,
    job = null
}) => {
    try {
        if (!recipient) {
            return;
        }

        await createNotification({
            recipient,
            recipientRole,
            type,
            title,
            message,
            job
        });
    } catch (error) {
        console.error(
            "Notification error:",
            error.message
        );
    }
};

// ======================================================
// HELPERS
// ======================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const isValidCoordinates = (
    latitude,
    longitude
) => {
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

const normalize = (value) => {
    return String(value || "")
        .trim()
        .toLowerCase();
};

// ======================================================
// CREATE JOB
// ======================================================

const createJob = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            requiredSkill,
            image,
            city,
            area,
            location,
            latitude,
            longitude,
            urgency,
            bookingType,
            minBudget,
            maxBudget
        } = req.body || {};

        if (
            !title ||
            !description ||
            !city ||
            !area ||
            !location ||
            latitude === undefined ||
            longitude === undefined ||
            !bookingType
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please fill all required job details"
            });
        }

        const cleanTitle =
            String(title).trim();

        const cleanDescription =
            String(description).trim();

        const cleanCity =
            String(city).trim();

        const cleanArea =
            String(area).trim();

        const cleanAddress =
            String(location).trim();

        if (
            cleanTitle.length < 3 ||
            cleanDescription.length < 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide valid title and description"
            });
        }

        if (
            !["instant", "quote"].includes(
                bookingType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid booking type"
            });
        }

        const finalUrgency =
            urgency || "normal";

        if (
            !["normal", "urgent"].includes(
                finalUrgency
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid urgency type"
            });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);

        if (
            !isValidCoordinates(
                lat,
                lng
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid latitude or longitude"
            });
        }

        // ==================================================
        // AI CLASSIFICATION
        // ==================================================

        let aiPrediction = null;

        try {
            aiPrediction =
                await predictJobDetails(
                    cleanDescription
                );
        } catch (error) {
            console.error(
                "AI prediction error:",
                error.message
            );
        }

        const finalCategory =
            category ||
            aiPrediction?.category ||
            "Other";

        const finalRequiredSkill =
            requiredSkill ||
            getRequiredSkill(finalCategory, "") ||
            aiPrediction?.requiredSkill ||
            "General Worker";

        const finalDifficulty =
            aiPrediction?.difficulty ||
            "Medium";

        // ==================================================
        // PRICE ESTIMATION
        // ==================================================

        let priceEstimate = {
            minPrice: 0,
            maxPrice: 0
        };

        try {
            const result =
                calculateEstimatedPrice({
                    category:
                        finalCategory,

                    difficulty:
                        finalDifficulty,

                    urgency:
                        finalUrgency
                });

            if (result) {
                priceEstimate = {
                    minPrice:
                        Number(
                            result.minPrice
                        ) || 0,

                    maxPrice:
                        Number(
                            result.maxPrice
                        ) || 0
                };
            }
        } catch (error) {
            console.error(
                "Price estimation error:",
                error.message
            );
        }

        // ==================================================
        // CREATE JOB
        // ==================================================

        const job = await Job.create({
            customer:
                req.user.id,

            title:
                cleanTitle,

            description:
                cleanDescription,

            category:
                String(
                    finalCategory
                ).trim(),

            requiredSkill:
                String(
                    finalRequiredSkill
                ).trim(),

            difficulty:
                finalDifficulty,

            image:
                image
                    ? String(image).trim()
                    : "",

            city:
                cleanCity,

            area:
                cleanArea,

            address:
                cleanAddress,

            location: {
                latitude: lat,
                longitude: lng
            },

            urgency:
                finalUrgency,

            bookingType,

            estimatedMinPrice:
                Number(minBudget) > 0
                    ? Number(minBudget)
                    : priceEstimate.minPrice,

            estimatedMaxPrice:
                Number(maxBudget) > 0
                    ? Number(maxBudget)
                    : priceEstimate.maxPrice,

            finalPrice:
                0,

            paymentStatus:
                "pending",

            paymentMethod:
                "mock",

            transactionId:
                null,

            paidAt:
                null,

            status:
                "posted",

            assignedWorker:
                null,

            otp:
                null,

            otpVerified:
                false
        });

        await notify({
            recipient:
                req.user.id,

            recipientRole:
                "customer",

            type:
                "job_created",

            title:
                "Job Posted",

            message:
                `Your job "${job.title}" has been posted successfully.`,

            job:
                job._id
        });

        const dispatchResult = await dispatchJob(job, notify);

        if (dispatchResult.dispatches.length > 0) {
            job.status = "searching";
            await job.save();
        } else {
            job.status = "no_worker_found";
            await job.save();
        }

        // #region agent log
        debugLog(
            "jobController.js:createJob",
            "Job created",
            {
                bookingType,
                category: finalCategory,
                requiredSkill: finalRequiredSkill,
                hasCoords: true,
            },
            "B"
        );
        // #endregion

        return res.status(201).json({
            success: true,

            message:
                "Job posted successfully",

            aiPrediction: {
                category:
                    finalCategory,

                requiredSkill:
                    finalRequiredSkill,

                difficulty:
                    finalDifficulty
            },

            estimatedPrice: {
                min:
                    priceEstimate.minPrice,

                max:
                    priceEstimate.maxPrice
            },

            job
        });

    } catch (error) {
        console.error(
            "Create job error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while creating job"
        });
    }
};

// ======================================================
// GET CUSTOMER JOBS
// ======================================================

const getMyJobs = async (req, res) => {
    try {
        const jobs =
            await Job.find({
                customer:
                    req.user.id
            })
                .populate(
                    "assignedWorker",
                    "name phone skills rating completedJobs isAvailable"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count:
                jobs.length,
            jobs
        });

    } catch (error) {
        console.error(
            "Get customer jobs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching jobs"
        });
    }
};

// ======================================================
// GET WORKER MY JOBS
// ======================================================

const getMyWorkerJobs = async (req, res) => {
    try {
        const jobs =
            await Job.find({
                assignedWorker:
                    req.user.id
            })
                .populate(
                    "customer",
                    "name phone city area"
                )
                .populate(
                    "assignedWorker",
                    "name phone skills rating completedJobs isAvailable"
                )
                .sort({
                    updatedAt: -1
                });

        return res.status(200).json({
            success: true,
            count:
                jobs.length,
            jobs
        });

    } catch (error) {
        console.error(
            "Get worker my jobs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching worker jobs"
        });
    }
};

// ======================================================
// GET SINGLE JOB
// ======================================================

const getJobDetails = async (
    req,
    res
) => {
    try {
        const { jobId } = req.params;

        if (
            !isValidObjectId(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID"
            });
        }

        const job =
            await Job.findOne({
                _id:
                    jobId,

                customer:
                    req.user.id
            })
                .populate(
                    "assignedWorker",
                    "name phone skills rating completedJobs isAvailable"
                )
                .populate(
                    "customer",
                    "name phone city area"
                );

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found"
            });
        }

        // #region agent log
        debugLog(
            "jobController.js:getJobDetails",
            "Customer job details",
            {
                status: job.status,
                hasOtp: Boolean(job.otp),
                hasLat: job.location?.latitude != null,
            },
            "D"
        );
        // #endregion

        return res.status(200).json({
            success: true,
            job
        });

    } catch (error) {
        console.error(
            "Get job details error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching job details"
        });
    }
};

// ======================================================
// GET AVAILABLE JOBS
// ======================================================

const getAvailableJobs = async (
    req,
    res
) => {
    try {
        const worker =
            await Worker.findById(
                req.user.id
            );

        if (!worker) {
            return res.status(404).json({
                success: false,
                message:
                    "Worker not found"
            });
        }

        if (!worker.isAvailable) {
            return res.status(200).json({
                success: true,
                count: 0,
                radius:
                    SERVICE_RADIUS_KM,
                message:
                    "You are currently offline",
                jobs: []
            });
        }

        if (
            !isValidCoordinates(
                worker.location?.latitude,
                worker.location?.longitude
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please update your location first"
            });
        }

        if (
            !Array.isArray(worker.skills) ||
            worker.skills.length === 0
        ) {
            return res.status(200).json({
                success: true,
                count: 0,
                radius:
                    SERVICE_RADIUS_KM,
                message:
                    "Please add your skills to receive jobs",
                jobs: []
            });
        }

        // Worker already has active job
        const activeJob =
            await Job.findOne({
                assignedWorker:
                    worker._id,

                status: {
                    $in:
                        ACTIVE_JOB_STATUSES
                }
            }).select(
                "_id title status"
            );

        if (activeJob) {
            return res.status(200).json({
                success: true,
                count: 0,
                radius:
                    SERVICE_RADIUS_KM,
                message:
                    "You already have an active job",
                activeJob,
                jobs: []
            });
        }

        const jobs =
            await Job.find({
                city:
                    worker.city,

                requiredSkill: {
                    $in:
                        worker.skills
                },

                status: {
                    $in:
                        AVAILABLE_JOB_STATUSES
                },

                assignedWorker:
                    null
            })
                .populate(
                    "customer",
                    "name phone city area"
                )
                .sort({
                    createdAt: -1
                });

        const nearbyJobs =
            jobs
                .map(job => {

                    if (
                        !isValidCoordinates(
                            job.location?.latitude,
                            job.location?.longitude
                        )
                    ) {
                        return null;
                    }

                    const distance =
                        calculateDistance(
                            worker.location.latitude,
                            worker.location.longitude,
                            job.location.latitude,
                            job.location.longitude
                        );

                    if (
                        !Number.isFinite(
                            distance
                        ) ||
                        distance >
                            SERVICE_RADIUS_KM
                    ) {
                        return null;
                    }

                    return {
                        ...job.toObject(),

                        distance:
                            Number(
                                distance.toFixed(2)
                            )
                    };
                })
                .filter(Boolean)
                .sort(
                    (a, b) =>
                        a.distance -
                        b.distance
                );

        return res.status(200).json({
            success: true,
            count:
                nearbyJobs.length,
            radius:
                SERVICE_RADIUS_KM,
            jobs:
                nearbyJobs
        });

    } catch (error) {
        console.error(
            "Get available jobs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while fetching available jobs"
        });
    }
};

// ======================================================
// ACCEPT JOB
// ======================================================

const acceptJob = async (
    req,
    res
) => {
    try {
        const { jobId } = req.params;
        const { quoteAmount } = req.body || {};

        if (
            !isValidObjectId(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID"
            });
        }

        const worker =
            await Worker.findById(
                req.user.id
            );

        if (!worker) {
            return res.status(404).json({
                success: false,
                message:
                    "Worker not found"
            });
        }

        if (!worker.isAvailable) {
            return res.status(400).json({
                success: false,
                message:
                    "You are currently offline"
            });
        }

        if (
            !isValidCoordinates(
                worker.location?.latitude,
                worker.location?.longitude
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please update your location first"
            });
        }

        // ==================================================
        // ACTIVE JOB PROTECTION
        // ==================================================

        const activeJob =
            await Job.findOne({
                assignedWorker:
                    worker._id,

                status: {
                    $in:
                        ACTIVE_JOB_STATUSES
                }
            }).select(
                "_id title status"
            );

        if (activeJob) {
            return res.status(409).json({
                success: false,
                message:
                    "You already have an active job",
                activeJob
            });
        }

        const job =
            await Job.findById(
                jobId
            );

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found"
            });
        }

        if (
            job.assignedWorker
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "This job has already been accepted by another worker"
            });
        }

        if (
            !AVAILABLE_JOB_STATUSES.includes(
                job.status
            )
        ) {
            return res.status(409).json({
                success: false,
                message:
                    `This job cannot be accepted because its current status is ${job.status}`
            });
        }

        const acceptedSkills = [
            job.requiredSkill,
            job.category,
            getRequiredSkill(job.category, "")
        ]
            .filter(Boolean)
            .map(normalize);

        const hasRequiredSkill =
            Array.isArray(worker.skills) &&
            worker.skills.some((skill) =>
                acceptedSkills.includes(normalize(skill))
            );

        if (!hasRequiredSkill) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have the required skill for this job"
            });
        }

        if (
            !isValidCoordinates(
                job.location?.latitude,
                job.location?.longitude
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Job location is invalid"
            });
        }

        const distance =
            calculateDistance(
                worker.location.latitude,
                worker.location.longitude,
                job.location.latitude,
                job.location.longitude
            );

        if (
            !Number.isFinite(distance)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to calculate job distance"
            });
        }

        if (
            distance >
            SERVICE_RADIUS_KM
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This job is outside your service radius"
            });
        }

        let workerQuote = null;

        if (job.bookingType === "quote") {
            if (
                !Number.isFinite(quoteAmount) ||
                quoteAmount <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a quote amount before accepting this job"
                });
            }

            const min = Number(job.estimatedMinPrice || 0);
            const max = Number(job.estimatedMaxPrice || 0);

            if (min > 0 && quoteAmount < min) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Quote must be at least ₹${min}`
                });
            }

            if (max > 0 && quoteAmount > max) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Quote cannot exceed the customer budget of ₹${max}`
                });
            }

            workerQuote = Number(quoteAmount.toFixed(2));
        }

        // ==================================================
        // ATOMIC JOB ASSIGNMENT
        // ==================================================

        const assignmentUpdate = {
            assignedWorker:
                worker._id,

            status:
                "accepted"
        };

        if (workerQuote !== null) {
            assignmentUpdate.workerQuote = workerQuote;
        }

        const lockedWorker =
            await Worker.findOneAndUpdate(
                {
                    _id: worker._id,
                    isAvailable: true
                },
                {
                    $set: {
                        isAvailable: false
                    },
                    $inc: {
                        acceptedJobs: 1
                    }
                },
                { new: true }
            );

        if (!lockedWorker) {
            return res.status(409).json({
                success: false,
                message: "You already have an active job"
            });
        }

        const updatedJob =
            await Job.findOneAndUpdate(
                {
                    _id:
                        jobId,

                    assignedWorker:
                        null,

                    status: {
                        $in:
                            AVAILABLE_JOB_STATUSES
                    }
                },

                {
                    $set: assignmentUpdate
                },

                {
                    new: true
                }
            )
                .populate(
                    "customer",
                    "name phone city area"
                )
                .populate(
                    "assignedWorker",
                    "name phone skills rating completedJobs isAvailable"
                );

        if (!updatedJob) {
            await Worker.findByIdAndUpdate(
                worker._id,
                {
                    $set: {
                        isAvailable: true
                    },
                    $inc: {
                        acceptedJobs: -1
                    }
                }
            );

            return res.status(409).json({
                success: false,
                message:
                    "This job was accepted by another worker just now"
            });
        }

        await acceptDispatch(jobId, worker._id);

        // ==================================================
        // CUSTOMER NOTIFICATION
        // ==================================================

        await notify({
            recipient:
                updatedJob.customer?._id ||
                updatedJob.customer,

            recipientRole:
                "customer",

            type:
                "job_accepted",

            title:
                "Worker Assigned",

            message:
                `A worker has accepted your job "${updatedJob.title}".`,

            job:
                updatedJob._id
        });

        return res.status(200).json({
            success: true,

            message:
                "Job accepted successfully",

            distance:
                Number(
                    distance.toFixed(2)
                ),

            job:
                updatedJob
        });

    } catch (error) {
        console.error(
            "Accept job error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while accepting job"
        });
    }
};

const rejectJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!isValidObjectId(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const dispatch = await rejectDispatch(
            jobId,
            req.user.id
        );

        if (!dispatch) {
            return res.status(409).json({
                success: false,
                message: "This job request is no longer active"
            });
        }

        const job = await Job.findById(jobId);
        if (job) {
            const nextDispatch = await dispatchJob(job, notify);
            job.status = nextDispatch.dispatches.length
                ? "searching"
                : "no_worker_found";
            await job.save();
        }

        return res.status(200).json({
            success: true,
            message: "Job request rejected"
        });
    } catch (error) {
        console.error("Reject job error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while rejecting job"
        });
    }
};

// ======================================================
// START TRAVEL
// ======================================================

const startTravel = async (
    req,
    res
) => {
    try {
        const {
            jobId
        } = req.params;

        if (
            !isValidObjectId(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID"
            });
        }

        const worker =
            await Worker.findById(
                req.user.id
            );

        if (!worker) {
            return res.status(404).json({
                success: false,
                message:
                    "Worker not found"
            });
        }

        const job =
            await Job.findOne({
                _id:
                    jobId,

                assignedWorker:
                    worker._id,

                status:
                    "accepted"
            });

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Accepted job not found"
            });
        }

        const otp =
            String(
                generateOTP()
            );

        job.otp =
            otp;

        job.otpVerified =
            false;

        job.status =
            "on_the_way";

        job.liveTrackingActive =
            true;

        job.workerLiveLocation = {
            latitude: worker.location?.latitude ?? null,
            longitude: worker.location?.longitude ?? null,
            updatedAt: new Date()
        };

        await job.save();

        await notify({
            recipient:
                job.customer,

            recipientRole:
                "customer",

            type:
                "worker_on_the_way",

            title:
                "Worker Is On The Way",

            message:
                `The worker is on the way for "${job.title}".`,

            job:
                job._id
        });

        return res.status(200).json({
            success: true,

            message:
                "Worker is on the way",

            job:
                job
        });

    } catch (error) {
        console.error(
            "Start travel error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while starting travel"
        });
    }
};

const arriveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const worker = await Worker.findById(req.user.id);

        if (!worker || !isValidObjectId(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid worker or job ID"
            });
        }

        const job = await Job.findOneAndUpdate(
            {
                _id: jobId,
                assignedWorker: worker._id,
                status: "on_the_way"
            },
            {
                $set: {
                    status: "arrived",
                    arrivedAt: new Date()
                }
            },
            { new: true }
        );

        if (!job) {
            return res.status(409).json({
                success: false,
                message: "Job is not currently on the way"
            });
        }

        await notify({
            recipient: job.customer,
            recipientRole: "customer",
            type: "worker_on_the_way",
            title: "Worker Has Arrived",
            message: `The worker has arrived for "${job.title}". Please share the start OTP.`,
            job: job._id
        });

        return res.status(200).json({
            success: true,
            message: "Arrival marked successfully",
            job
        });
    } catch (error) {
        console.error("Arrive job error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while marking arrival"
        });
    }
};

// ======================================================
// VERIFY JOB OTP
// ======================================================

const verifyJobOTP = async (
    req,
    res
) => {
    try {
        const {
            jobId
        } = req.params;

        const {
            otp
        } = req.body || {};

        if (
            !isValidObjectId(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID"
            });
        }

        if (
            otp === undefined ||
            otp === null ||
            String(otp).trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "OTP is required"
            });
        }

        const worker =
            await Worker.findById(
                req.user.id
            );

        if (!worker) {
            return res.status(404).json({
                success: false,
                message:
                    "Worker not found"
            });
        }

        const job =
            await Job.findOne({
                _id:
                    jobId,

                assignedWorker:
                    worker._id,

                status: {
                    $in: ["on_the_way", "arrived"]
                }
            });

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found or OTP cannot be verified"
            });
        }

        if (
            !job.otp
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "OTP is no longer valid"
            });
        }

        if (
            String(job.otp) !==
            String(otp).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid OTP"
            });
        }

        job.otpVerified =
            true;

        job.otp =
            null;

        job.status =
            "in_progress";

        job.startedAt =
            new Date();

        job.liveTrackingActive =
            false;

        job.workerLiveLocation = {
            latitude: null,
            longitude: null,
            updatedAt: new Date()
        };

        await job.save();

        await notify({
            recipient:
                job.customer,

            recipientRole:
                "customer",

            type:
                "otp_verified",

            title:
                "Job Started",

            message:
                `OTP verified. Your job "${job.title}" has started.`,

            job:
                job._id
        });

        return res.status(200).json({
            success: true,

            message:
                "OTP verified. Job started successfully",

            jobId:
                job._id,

            status:
                job.status
        });

    } catch (error) {
        console.error(
            "OTP verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while verifying OTP"
        });
    }
};

// ======================================================
// SET FINAL PRICE
// ======================================================

const setFinalPrice = async (
    req,
    res
) => {
    try {
        const {
            jobId
        } = req.params;

        const {
            finalPrice
        } = req.body || {};

        if (
            !isValidObjectId(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID"
            });
        }

        const price =
            Number(finalPrice);

        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Final price must be a valid positive number"
            });
        }

        const job =
            await Job.findOne({
                _id:
                    jobId,

                assignedWorker:
                    req.user.id
            });

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found or you are not assigned to this job"
            });
        }

        if (
            job.status !==
            "in_progress"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Final price can only be set while the job is in progress"
            });
        }

        if (
            job.paymentStatus ===
            "paid"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment has already been completed"
            });
        }

        if (
            Number(job.finalPrice) > 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Final price has already been set"
            });
        }

        job.finalPrice =
            Number(
                price.toFixed(2)
            );

        job.paymentStatus =
            "pending";

        await job.save();

        await notify({
            recipient:
                job.customer,

            recipientRole:
                "customer",

            type:
                "final_price",

            title:
                "Final Price Set",

            message:
                `Final price for "${job.title}" is ₹${job.finalPrice}.`,

            job:
                job._id
        });

        return res.status(200).json({
            success: true,

            message:
                "Final price updated successfully",

            finalPrice:
                job.finalPrice,

            paymentStatus:
                job.paymentStatus,

            jobId:
                job._id
        });

    } catch (error) {
        console.error(
            "Set final price error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while setting final price"
        });
    }
};

// ======================================================
// MOCK PAYMENT
// ======================================================

const makePayment = async (
    req,
    res
) => {
    try {
        const {
            jobId
        } = req.params;

        if (
            !isValidObjectId(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID"
            });
        }

        const job =
            await Job.findOne({
                _id:
                    jobId,

                customer:
                    req.user.id
            });

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found"
            });
        }

        if (
            job.status !==
            "in_progress"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment can only be made while the job is in progress"
            });
        }

        if (
            !job.finalPrice ||
            Number(job.finalPrice) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Final price has not been set yet"
            });
        }

        if (
            job.paymentStatus ===
            "paid"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment has already been completed",

                transactionId:
                    job.transactionId
            });
        }

        const transactionId =
            `MOCK_${Date.now()}_${Math.floor(
                Math.random() * 100000
            )}`;

        job.paymentStatus =
            "paid";

        job.paymentMethod =
            "mock";

        job.transactionId =
            transactionId;

        job.platformFee = 0;
        job.discount = 0;
        job.invoiceNumber = `INV_${Date.now()}`;

        job.paidAt =
            new Date();

        await job.save();

        await notify({
            recipient:
                job.assignedWorker,

            recipientRole:
                "worker",

            type:
                "payment",

            title:
                "Payment Received",

            message:
                `Customer completed the mock payment of ₹${job.finalPrice}.`,

            job:
                job._id
        });

        return res.status(200).json({
            success: true,

            message:
                "Mock payment successful",

            payment: {
                amount:
                    job.finalPrice,

                paymentMethod:
                    job.paymentMethod,

                paymentStatus:
                    job.paymentStatus,

                transactionId:
                    job.transactionId,

                paidAt:
                    job.paidAt,

                invoiceNumber:
                    job.invoiceNumber,

                platformFee:
                    job.platformFee,

                discount:
                    job.discount
            },

            jobId:
                job._id
        });

    } catch (error) {
        console.error(
            "Fake payment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while processing payment"
        });
    }
};

// ======================================================
// COMPLETE JOB
// ======================================================

const completeJob = async (
    req,
    res
) => {
    try {
        const {
            jobId
        } = req.params;

        const {
            notes = "",
            photos = []
        } = req.body || {};

        if (
            !isValidObjectId(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID"
            });
        }

        const worker =
            await Worker.findById(
                req.user.id
            );

        if (!worker) {
            return res.status(404).json({
                success: false,
                message:
                    "Worker not found"
            });
        }

        const job =
            await Job.findOne({
                _id:
                    jobId,

                assignedWorker:
                    worker._id,

                status:
                    "in_progress"
            });

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found or job is not in progress"
            });
        }

        if (
            !job.finalPrice ||
            Number(job.finalPrice) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please set final price before completing the job"
            });
        }

        if (
            job.paymentStatus !==
            "paid"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Customer payment is pending"
            });
        }

        job.status =
            "completed";

        job.completionNotes = String(notes).trim().slice(0, 2000);
        job.completionPhotos = Array.isArray(photos)
            ? photos.map((photo) => String(photo).trim()).filter(Boolean).slice(0, 10)
            : [];

        await job.save();

        await Worker.findByIdAndUpdate(
            worker._id,
            {
                $inc: {
                    completedJobs: 1
                },

                $set: {
                    isAvailable:
                        true
                }
            }
        );

        await notify({
            recipient:
                job.customer,

            recipientRole:
                "customer",

            type:
                "job_completed",

            title:
                "Job Completed",

            message:
                `Your job "${job.title}" has been completed successfully.`,

            job:
                job._id
        });

        const completedJob =
            await Job.findById(
                job._id
            )
                .populate(
                    "customer",
                    "name phone city area"
                )
                .populate(
                    "assignedWorker",
                    "name phone skills rating completedJobs isAvailable"
                );

        return res.status(200).json({
            success: true,

            message:
                "Job completed successfully",

            job:
                completedJob
        });

    } catch (error) {
        console.error(
            "Complete job error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while completing job"
        });
    }
};

// ======================================================
// RATE WORKER
// ======================================================

const rateWorker = async (
    req,
    res
) => {
    try {
        const {
            jobId
        } = req.params;

        const {
            rating,
            review
        } = req.body || {};

        if (
            !isValidObjectId(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID"
            });
        }

        const numericRating =
            Number(rating);

        if (
            !Number.isFinite(
                numericRating
            ) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rating must be between 1 and 5"
            });
        }

        const job =
            await Job.findOne({
                _id:
                    jobId,

                customer:
                    req.user.id
            });

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found"
            });
        }

        if (
            job.status !==
            "completed"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You can rate the worker only after job completion"
            });
        }

        if (
            !job.assignedWorker
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No worker was assigned to this job"
            });
        }

        if (
            job.rating !== null &&
            job.rating !== undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You have already rated this job"
            });
        }

        const worker =
            await Worker.findById(
                job.assignedWorker
            );

        if (!worker) {
            return res.status(404).json({
                success: false,
                message:
                    "Worker not found"
            });
        }

        const previousCompletedJobs =
            Math.max(
                Number(
                    worker.completedJobs || 0
                ) - 1,
                0
            );

        const oldRating =
            Number(
                worker.rating || 0
            );

        let newRating;

        if (
            previousCompletedJobs === 0
        ) {
            newRating =
                numericRating;
        } else {
            newRating =
                (
                    (
                        oldRating *
                        previousCompletedJobs
                    ) +
                    numericRating
                ) /
                (
                    previousCompletedJobs + 1
                );
        }

        job.rating =
            numericRating;

        job.review =
            typeof review === "string"
                ? review
                    .trim()
                    .slice(0, 1000)
                : "";

        job.ratedAt =
            new Date();

        await job.save();

        worker.rating =
            Number(
                newRating.toFixed(1)
            );

        await worker.save();

        return res.status(200).json({
            success: true,

            message:
                "Worker rated successfully",

            rating:
                numericRating,

            review:
                job.review,

            worker: {
                id:
                    worker._id,

                name:
                    worker.name,

                rating:
                    worker.rating
            }
        });

    } catch (error) {
        console.error(
            "Rate worker error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while rating worker"
        });
    }
};

// ======================================================
// CANCEL JOB
// CUSTOMER + WORKER
// ======================================================

const cancelJob = async (
    req,
    res
) => {
    try {
        const {
            jobId
        } = req.params;

        const {
            reason
        } = req.body || {};

        if (
            !isValidObjectId(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID"
            });
        }

        const job =
            await Job.findById(
                jobId
            );

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found"
            });
        }

        const currentUser =
            String(
                req.user.id
            );

        const customerId =
            String(
                job.customer
            );

        const workerId =
            job.assignedWorker
                ? String(
                    job.assignedWorker
                )
                : null;

        let cancelledBy;

        if (
            currentUser ===
            customerId
        ) {
            cancelledBy =
                "customer";

        } else if (
            currentUser ===
            workerId
        ) {
            cancelledBy =
                "worker";

        } else {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to cancel this job"
            });
        }

        if (
            job.status ===
            "completed"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Completed job cannot be cancelled"
            });
        }

        if (
            job.status ===
            "cancelled"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Job is already cancelled"
            });
        }

        if (
            job.paymentStatus ===
            "paid"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Paid job cannot be cancelled in the mini project"
            });
        }

        job.status =
            "cancelled";

        job.cancellationReason =
            reason
                ? String(reason)
                    .trim()
                    .slice(0, 500)
                : "No reason provided";

        job.cancelledBy =
            cancelledBy;

        job.cancelledAt =
            new Date();

        job.otp =
            null;

        job.otpVerified =
            false;

        await job.save();

        // ==================================================
        // RELEASE WORKER
        // ==================================================

        if (
            job.assignedWorker
        ) {
            await Worker.findByIdAndUpdate(
                job.assignedWorker,
                {
                    $set: {
                        isAvailable:
                            true
                    }
                }
            );
        }

        // ==================================================
        // WORKER CANCELS
        // ==================================================

        if (
            cancelledBy ===
            "worker"
        ) {
            await notify({
                recipient:
                    job.customer,

                recipientRole:
                    "customer",

                type:
                    "job_cancelled",

                title:
                    "Job Cancelled",

                message:
                    `The worker cancelled "${job.title}". Reason: ${job.cancellationReason}`,

                job:
                    job._id
            });
        }

        // ==================================================
        // CUSTOMER CANCELS
        // ==================================================

        if (
            cancelledBy ===
                "customer" &&
            job.assignedWorker
        ) {
            await notify({
                recipient:
                    job.assignedWorker,

                recipientRole:
                    "worker",

                type:
                    "job_cancelled",

                title:
                    "Job Cancelled",

                message:
                    `The customer cancelled "${job.title}". Reason: ${job.cancellationReason}`,

                job:
                    job._id
            });
        }

        const cancelledJob =
            await Job.findById(
                job._id
            )
                .populate(
                    "customer",
                    "name phone city area"
                )
                .populate(
                    "assignedWorker",
                    "name phone skills rating completedJobs isAvailable"
                );

        return res.status(200).json({
            success: true,

            message:
                "Job cancelled successfully",

            cancelledBy,

            job:
                cancelledJob
        });

    } catch (error) {
        console.error(
            "Cancel job error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while cancelling job"
        });
    }
};

const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!isValidObjectId(jobId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const job = await Job.findOne({
            _id: jobId,
            customer: req.user.id
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        if (
            job.assignedWorker ||
            [
                "accepted",
                "on_the_way",
                "otp_verified",
                "in_progress",
                "completed"
            ].includes(job.status) ||
            job.paymentStatus === "paid"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This job cannot be deleted after work has started"
            });
        }

        await Job.deleteOne({ _id: job._id });

        return res.status(200).json({
            success: true,
            message: "Job deleted successfully"
        });
    } catch (error) {
        console.error("Delete job error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting job"
        });
    }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    createJob,
    getMyJobs,
    getMyWorkerJobs,
    getJobDetails,
    getAvailableJobs,
    acceptJob,
    rejectJob,
    startTravel,
    arriveJob,
    verifyJobOTP,
    setFinalPrice,
    makePayment,
    completeJob,
    rateWorker,
    cancelJob,
    deleteJob
};