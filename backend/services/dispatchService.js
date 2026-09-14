const JobDispatch = require("../models/JobDispatch");
const Job = require("../models/Job");
const Worker = require("../models/Worker");
const { calculateDistance } = require("./locationService");
const { getRequiredSkill } = require("../utils/skillMap");
const { createNotification } = require("./notificationService");

const DISPATCH_TIMEOUT_MS = 30 * 1000;
const DISPATCH_RADII = [3, 5, 8];

const normalize = (value) => String(value || "").trim().toLowerCase();

const validCoordinates = (location) => {
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);

    return Number.isFinite(latitude) && Number.isFinite(longitude);
};

const matchesSkill = (worker, job) => {
    const acceptedSkills = [
        job.requiredSkill,
        job.category,
        getRequiredSkill(job.category, ""),
    ]
        .filter(Boolean)
        .map(normalize);

    return Array.isArray(worker.skills) && worker.skills.some((skill) =>
        acceptedSkills.includes(normalize(skill))
    );
};

const getEligibleWorkers = async (job) => {
    const workers = await Worker.find({
        isAvailable: true,
        isBlocked: { $ne: true },
    }).select("location skills isAvailable");

    return workers
        .filter((worker) =>
            matchesSkill(worker, job) &&
            validCoordinates(worker.location) &&
            validCoordinates(job.location)
        )
        .map((worker) => ({
            worker,
            distance: calculateDistance(
                worker.location.latitude,
                worker.location.longitude,
                job.location.latitude,
                job.location.longitude
            ),
        }))
        .filter((entry) => entry.distance <= DISPATCH_RADII.at(-1))
        .sort((a, b) => a.distance - b.distance);
};

const dispatchJob = async (job, notify = createNotification) => {
    const eligible = await getEligibleWorkers(job);
    const existing = await JobDispatch.find({ job: job._id })
        .select("worker status");
    const alreadyDispatched = new Set(
        existing
            .filter((record) => record.status !== "cancelled")
            .map((record) => String(record.worker))
    );
    const freshEligible = eligible.filter((entry) =>
        !alreadyDispatched.has(String(entry.worker._id))
    );
    const radiusRound = eligible.length
        ? DISPATCH_RADII.find((radius) => freshEligible.some((entry) => entry.distance <= radius))
        : null;

    if (!radiusRound) {
        return { dispatches: [], radiusRound: null };
    }

    const selected = freshEligible.filter((entry) => entry.distance <= radiusRound);
    const expiresAt = new Date(Date.now() + DISPATCH_TIMEOUT_MS);
    const dispatches = [];

    for (const entry of selected) {
        const dispatch = await JobDispatch.findOneAndUpdate(
            { job: job._id, worker: entry.worker._id },
            {
                $setOnInsert: {
                    job: job._id,
                    worker: entry.worker._id,
                    status: "pending",
                    distance: Number(entry.distance.toFixed(2)),
                    radiusRound,
                    sentAt: new Date(),
                    expiresAt,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        dispatches.push(dispatch);

        await notify({
            recipient: entry.worker._id,
            recipientRole: "worker",
            type: "job_available",
            title: "New Service Request",
            message: `${job.title} is ${entry.distance.toFixed(1)} km away. Accept within 30 seconds.`,
            job: job._id,
        });
    }

    return { dispatches, radiusRound };
};

const expireDispatches = async (jobId) => {
    const now = new Date();
    await JobDispatch.updateMany(
        {
            job: jobId,
            status: "pending",
            expiresAt: { $lte: now },
        },
        {
            $set: { status: "expired", respondedAt: now },
        }
    );

    return JobDispatch.find({ job: jobId });
};

const expireAndFinalizeDispatches = async (jobId) => {
    const records = await expireDispatches(jobId);
    const hasRecords = records.length > 0;
    const exhausted = records.every((record) =>
        ["rejected", "expired", "cancelled"].includes(record.status)
    );

    if (hasRecords && exhausted) {
        const job = await Job.findOne({
            _id: jobId,
            assignedWorker: null,
            status: { $in: ["posted", "searching"] },
        });

        if (job) {
            const nextRound = await dispatchJob(job);

            job.status = nextRound.dispatches.length
                ? "searching"
                : "no_worker_found";

            await job.save();
        }
    }

    return records;
};

const rejectDispatch = async (jobId, workerId) => {
    return JobDispatch.findOneAndUpdate(
        {
            job: jobId,
            worker: workerId,
            status: "pending",
        },
        {
            $set: { status: "rejected", respondedAt: new Date() },
        },
        { new: true }
    );
};

const acceptDispatch = async (jobId, workerId) => {
    await JobDispatch.findOneAndUpdate(
        { job: jobId, worker: workerId, status: "pending" },
        { $set: { status: "accepted", respondedAt: new Date() } },
        { new: true }
    );

    await JobDispatch.updateMany(
        {
            job: jobId,
            worker: { $ne: workerId },
            status: "pending",
        },
        { $set: { status: "cancelled", respondedAt: new Date() } }
    );
};

module.exports = {
    DISPATCH_TIMEOUT_MS,
    DISPATCH_RADII,
    dispatchJob,
    expireDispatches,
    expireAndFinalizeDispatches,
    rejectDispatch,
    acceptDispatch,
};
