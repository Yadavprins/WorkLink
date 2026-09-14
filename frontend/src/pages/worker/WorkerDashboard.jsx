import {
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    IndianRupee,
    MapPin,
    Navigation,
    Power,
    RefreshCw,
    Star,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { Link } from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";
import workerJobService from "../../services/workerJobService";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const WorkerDashboard = () => {
    const {
        user,
        token,
        updateUser,
    } = useAuth();

    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    const [dashboard, setDashboard] =
        useState(null);

    const [earningsData, setEarningsData] =
        useState(null);

    const [profileWorker, setProfileWorker] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [onlineLoading, setOnlineLoading] =
        useState(false);

    const [locationLoading, setLocationLoading] =
        useState(false);

    const [jobPrompt, setJobPrompt] =
        useState(null);

    const [dismissedJobId, setDismissedJobId] =
        useState(null);

    const [acceptingJob, setAcceptingJob] =
        useState(false);

    // =====================================================
    // API REQUEST
    // =====================================================

    const apiRequest = useCallback(
        async (endpoint, options = {}) => {
            if (!token) {
                throw new Error(
                    "Authentication required. Please login again."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                        ...(options.headers || {}),
                    },
                }
            );

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                const error = new Error(
                    data?.message ||
                        `Request failed with status ${response.status}`
                );

                error.status =
                    response.status;

                throw error;
            }

            if (data?.success === false) {
                throw new Error(
                    data?.message ||
                        "Request failed."
                );
            }

            return data;
        },
        [token]
    );

    // =====================================================
    // LOAD WORKER PROFILE
    // =====================================================

    const loadWorkerProfile =
        useCallback(async () => {
            const data =
                await apiRequest(
                    "/workers/profile"
                );

            const worker =
                data?.worker ||
                data?.user ||
                data?.data ||
                null;

            if (worker) {
                setProfileWorker(worker);

                updateUser({
                    ...worker,
                    role: "worker",
                });
            }

            return worker;
        }, [
            apiRequest,
            updateUser,
        ]);

    // =====================================================
    // SILENT DASHBOARD REFRESH
    // Does NOT reset dashboard/loading UI
    // =====================================================

    const refreshDashboardSilently =
        useCallback(async () => {
            try {
                const results =
                    await Promise.allSettled([
                        apiRequest(
                            "/workers/dashboard"
                        ),
                        apiRequest(
                            "/workers/earnings"
                        ),
                    ]);

                const dashboardResult =
                    results[0];

                const earningsResult =
                    results[1];

                if (
                    dashboardResult.status ===
                    "fulfilled"
                ) {
                    setDashboard(
                        dashboardResult.value
                            ?.dashboard ||
                            dashboardResult.value ||
                            null
                    );
                }

                if (
                    earningsResult.status ===
                    "fulfilled"
                ) {
                    setEarningsData(
                        earningsResult.value
                            ?.earnings || null
                    );
                }
            } catch (err) {
                console.error(
                    "Silent dashboard refresh error:",
                    err
                );
            }
        }, [apiRequest]);

    // =====================================================
    // LOAD DASHBOARD + EARNINGS
    // =====================================================

    const loadData = useCallback(
        async (isRefresh = false) => {
            if (!token) {
                setLoading(false);

                setError(
                    "Authentication required. Please login again."
                );

                return;
            }

            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const worker =
                    await loadWorkerProfile();

                const isWorkerOnline =
                    Boolean(
                        worker?.isAvailable
                    );

                const earningsPromise =
                    apiRequest(
                        "/workers/earnings"
                    ).catch((err) => {
                        console.error(
                            "Worker earnings error:",
                            err
                        );

                        return null;
                    });

                let dashboardResponse =
                    null;

                if (isWorkerOnline) {
                    try {
                        dashboardResponse =
                            await apiRequest(
                                "/workers/dashboard"
                            );
                    } catch (dashboardError) {
                        console.error(
                            "Worker dashboard API error:",
                            dashboardError
                        );

                        dashboardResponse =
                            null;
                    }
                }

                const earningsResponse =
                    await earningsPromise;

                setDashboard(
                    dashboardResponse?.dashboard ||
                        dashboardResponse ||
                        null
                );

                setEarningsData(
                    earningsResponse?.earnings ||
                        null
                );
            } catch (err) {
                console.error(
                    "Worker dashboard error:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to load worker dashboard."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [
            token,
            loadWorkerProfile,
            apiRequest,
        ]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        if (!token) {
            setLoading(false);

            return undefined;
        }

        loadData();

        const refreshTimer = setInterval(() => {
            loadData(true);
        }, 15000);

        return () => clearInterval(refreshTimer);
    }, [token, loadData]);

    // =====================================================
    // BACKEND DATA
    // =====================================================

    const worker =
        dashboard?.worker ||
        profileWorker ||
        {};

    const statistics =
        dashboard?.statistics ||
        dashboard?.stats ||
        {};

    const nearbyJobs =
        Array.isArray(
            dashboard?.nearbyJobs
        )
            ? dashboard.nearbyJobs
            : [];

    const totalEarnings =
        Number(
            earningsData?.total ||
                earningsData?.totalEarnings ||
                0
        );

    const completedJobs =
        Number(
            statistics.completedJobs ??
                0
        );

    const workerCompletedJobs =
        Number(
            statistics.completedJobsCount ??
                worker.completedJobs ??
                completedJobs
        );

    const workerRating =
        Number(
            statistics.rating ??
                worker.rating ??
                0
        );

    const isAvailable =
        Boolean(
            worker?.isAvailable
        );

    useEffect(() => {
        if (
            nearbyJobs.length > 0 &&
            !jobPrompt &&
            String(
                nearbyJobs[0]?._id ||
                    nearbyJobs[0]?.id
            ) !== String(dismissedJobId)
        ) {
            setJobPrompt(nearbyJobs[0]);
        }
    }, [nearbyJobs, jobPrompt, dismissedJobId]);

    const acceptPromptJob = async () => {
        const jobId =
            jobPrompt?._id ||
            jobPrompt?.id;

        if (!jobId || acceptingJob) {
            return;
        }

        try {
            setAcceptingJob(true);
            await workerJobService.acceptJob(jobId);
            setJobPrompt(null);
            await loadData(true);
        } catch (err) {
            setError(
                err?.message ||
                    "Unable to accept this job."
            );
        } finally {
            setAcceptingJob(false);
        }
    };

    const workerName =
        worker?.name ||
        user?.name ||
        "Worker";

    // =====================================================
    // GPS CHECK
    // =====================================================

    const hasValidLocation = () => {
        const latitude =
            worker?.location?.latitude;

        const longitude =
            worker?.location?.longitude;

        return (
            Number.isFinite(
                Number(latitude)
            ) &&
            Number.isFinite(
                Number(longitude)
            )
        );
    };

    // =====================================================
    // SAVE CURRENT LOCATION
    // =====================================================

    const saveCurrentLocation =
        () => {
            return new Promise(
                (resolve, reject) => {
                    if (
                        !navigator.geolocation
                    ) {
                        reject(
                            new Error(
                                "Geolocation is not supported by this browser."
                            )
                        );

                        return;
                    }

                    navigator.geolocation.getCurrentPosition(
                        async (
                            position
                        ) => {
                            try {
                                const latitude =
                                    Number(
                                        position
                                            .coords
                                            .latitude
                                    );

                                const longitude =
                                    Number(
                                        position
                                            .coords
                                            .longitude
                                    );

                                const data =
                                    await apiRequest(
                                        "/workers/location",
                                        {
                                            method:
                                                "PATCH",
                                            body: JSON.stringify(
                                                {
                                                    latitude,
                                                    longitude,
                                                }
                                            ),
                                        }
                                    );

                                const savedLocation =
                                    data?.location ||
                                    data?.worker
                                        ?.location ||
                                    {
                                        latitude,
                                        longitude,
                                    };

                                setProfileWorker(
                                    (
                                        previous
                                    ) => ({
                                        ...(previous ||
                                            {}),
                                        location:
                                            savedLocation,
                                    })
                                );

                                updateUser({
                                    location:
                                        savedLocation,
                                });

                                resolve(
                                    savedLocation
                                );
                            } catch (err) {
                                reject(err);
                            }
                        },
                        (geoError) => {
                            let message =
                                "Unable to get your current location.";

                            if (
                                geoError.code ===
                                1
                            ) {
                                message =
                                    "Location permission denied. Please allow location access.";
                            } else if (
                                geoError.code ===
                                2
                            ) {
                                message =
                                    "Your current location is unavailable.";
                            } else if (
                                geoError.code ===
                                3
                            ) {
                                message =
                                    "Location request timed out. Please try again.";
                            }

                            reject(
                                new Error(
                                    message
                                )
                            );
                        },
                        {
                            enableHighAccuracy:
                                true,
                            timeout: 15000,
                            maximumAge: 0,
                        }
                    );
                }
            );
        };

    // =====================================================
    // GO ONLINE / OFFLINE
    // =====================================================

    const toggleAvailability =
        async () => {
            if (!token) {
                setError(
                    "Authentication required. Please login again."
                );

                return;
            }

            if (
                onlineLoading ||
                locationLoading
            ) {
                return;
            }

            setOnlineLoading(true);
            setError("");

            try {
                // =========================================
                // GO OFFLINE
                // =========================================

                if (isAvailable) {
                    const data =
                        await apiRequest(
                            "/workers/availability",
                            {
                                method:
                                    "PATCH",
                                body: JSON.stringify(
                                    {
                                        isAvailable:
                                            false,
                                    }
                                ),
                            }
                        );

                    const updatedWorker =
                        data?.worker ||
                        data?.user ||
                        data?.data ||
                        {};

                    // Immediately update UI.
                    setProfileWorker(
                        (previous) => ({
                            ...(previous ||
                                {}),
                            ...updatedWorker,
                            isAvailable:
                                false,
                        })
                    );

                    updateUser({
                        ...updatedWorker,
                        isAvailable:
                            false,
                        role: "worker",
                    });

                    // IMPORTANT:
                    // Do NOT clear dashboard.
                    // Do NOT call loadData().
                    // This prevents UI flicker.
                    setDashboard(
                        (previous) => {
                            if (!previous) {
                                return previous;
                            }

                            return {
                                ...previous,
                                worker: {
                                    ...(previous.worker ||
                                        {}),
                                    isAvailable:
                                        false,
                                },
                            };
                        }
                    );

                    return;
                }

                // =========================================
                // GO ONLINE
                // =========================================

                let locationIsValid =
                    hasValidLocation();

                // Get GPS only when necessary.
                if (!locationIsValid) {
                    setLocationLoading(true);

                    try {
                        await saveCurrentLocation();

                        locationIsValid =
                            true;
                    } finally {
                        setLocationLoading(
                            false
                        );
                    }
                }

                if (!locationIsValid) {
                    throw new Error(
                        "Valid GPS location is required before going online."
                    );
                }

                // Update backend availability.
                const data =
                    await apiRequest(
                        "/workers/availability",
                        {
                            method:
                                "PATCH",
                            body: JSON.stringify(
                                {
                                    isAvailable:
                                        true,
                                }
                            ),
                        }
                    );

                const updatedWorker =
                    data?.worker ||
                    data?.user ||
                    data?.data ||
                    {};

                // =========================================
                // OPTIMISTIC UI UPDATE
                // =========================================

                setProfileWorker(
                    (previous) => ({
                        ...(previous ||
                            {}),
                        ...updatedWorker,
                        isAvailable:
                            true,
                    })
                );

                updateUser({
                    ...updatedWorker,
                    isAvailable:
                        true,
                    role: "worker",
                });

                // Update existing dashboard state
                // without destroying it.
                setDashboard(
                    (previous) => ({
                        ...(previous || {}),
                        worker: {
                            ...(previous?.worker ||
                                {}),
                            ...updatedWorker,
                            isAvailable:
                                true,
                        },
                    })
                );

                // =========================================
                // BACKGROUND REFRESH
                // =========================================
                //
                // This loads nearby jobs without putting
                // the whole dashboard into loading state.

                try {
                    const dashboardResponse =
                        await apiRequest(
                            "/workers/dashboard"
                        );

                    if (
                        dashboardResponse?.dashboard
                    ) {
                        setDashboard(
                            dashboardResponse.dashboard
                        );
                    }
                } catch (dashboardError) {
                    console.error(
                        "Nearby jobs refresh error:",
                        dashboardError
                    );
                }

                // Earnings are independent.
                try {
                    const earningsResponse =
                        await apiRequest(
                            "/workers/earnings"
                        );

                    if (
                        earningsResponse?.earnings
                    ) {
                        setEarningsData(
                            earningsResponse.earnings
                        );
                    }
                } catch (earningsError) {
                    console.error(
                        "Earnings refresh error:",
                        earningsError
                    );
                }
            } catch (err) {
                console.error(
                    "Availability update error:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to update availability."
                );
            } finally {
                setOnlineLoading(false);
                setLocationLoading(false);
            }
        };

    // =====================================================
    // LOCATION HELPER
    // =====================================================

    const getJobLocation = (job) => {
        if (!job) {
            return "Location not specified";
        }

        if (
            typeof job.location ===
            "string"
        ) {
            return job.location;
        }

        if (
            typeof job.locationText ===
                "string" &&
            job.locationText.trim()
        ) {
            return job.locationText;
        }

        if (
            job.location &&
            typeof job.location ===
                "object"
        ) {
            if (
                job.location.address
            ) {
                return job.location.address;
            }

            if (
                job.location.area
            ) {
                return job.location.area;
            }

            if (
                job.location.city
            ) {
                return job.location.city;
            }

            const latitude =
                job.location.latitude ??
                job.location.lat;

            const longitude =
                job.location.longitude ??
                job.location.lng;

            if (
                latitude !==
                    undefined &&
                longitude !==
                    undefined
            ) {
                return `${latitude}, ${longitude}`;
            }
        }

        const area =
            job.area ||
            job.customer?.area ||
            "";

        const city =
            job.city ||
            job.customer?.city ||
            "";

        const location = [
            area,
            city,
        ]
            .filter(Boolean)
            .join(", ");

        return (
            location ||
            "Location not specified"
        );
    };

    // =====================================================
    // PRICE HELPER
    // =====================================================

    const getJobPrices = (job) => {
        const min = Number(
            job?.estimatedMinPrice ??
                job?.estimatedPrice?.min ??
                job?.budget?.min ??
                0
        );

        const max = Number(
            job?.estimatedMaxPrice ??
                job?.estimatedPrice?.max ??
                job?.budget?.max ??
                0
        );

        return {
            min,
            max,
        };
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="app-layout">

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() =>
                    setSidebarOpen(false)
                }
            />

            <div className="main-area">

                <Navbar
                    onMenuClick={() =>
                        setSidebarOpen(true)
                    }
                />

                <main className="dashboard-content">

                    {jobPrompt && (
                        <div
                            role="dialog"
                            aria-live="polite"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "16px",
                                padding: "16px",
                                marginBottom: "18px",
                                borderRadius: "10px",
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                            }}
                        >
                            <div>
                                <strong>
                                    New job available nearby
                                </strong>
                                <p style={{ margin: "4px 0 0" }}>
                                    {jobPrompt.title} is within {jobPrompt.distance ?? "5"} km. Accept it?
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: "8px" }}>
                                <Link
                                    className="secondary-btn"
                                    to={`/worker/jobs/${jobPrompt._id || jobPrompt.id}`}
                                    onClick={() => {
                                        setDismissedJobId(
                                            jobPrompt._id || jobPrompt.id
                                        );
                                        setJobPrompt(null);
                                    }}
                                >
                                    View Details
                                </Link>
                                <button
                                    type="button"
                                    className="primary-btn"
                                    onClick={acceptPromptJob}
                                    disabled={acceptingJob}
                                >
                                    {acceptingJob ? "Accepting..." : "Accept Job"}
                                </button>
                                <button
                                    type="button"
                                    aria-label="Dismiss job notification"
                                    onClick={() => {
                                        setDismissedJobId(
                                            jobPrompt._id || jobPrompt.id
                                        );
                                        setJobPrompt(null);
                                    }}
                                >
                                    Later
                                </button>
                            </div>
                        </div>
                    )}

                    {/* HEADER */}

                    <section className="page-heading-row">

                        <div>

                            <span className="page-eyebrow">
                                WORKER DASHBOARD
                            </span>

                            <h1>
                                Good morning,{" "}
                                {workerName}
                            </h1>

                            <p>
                                Find nearby jobs,
                                manage assignments
                                and grow your
                                earnings.
                            </p>

                        </div>

                        {/* ONLINE STATUS + BUTTON */}

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: "12px",
                                flexWrap:
                                    "wrap",
                            }}
                        >

                            <div className="worker-online-status">

                                <span
                                    style={{
                                        background:
                                            isAvailable
                                                ? "#16a34a"
                                                : "#9ca3af",
                                    }}
                                />

                                {isAvailable
                                    ? "Available for Jobs"
                                    : "Offline"}

                            </div>

                            <button
                                type="button"
                                onClick={
                                    toggleAvailability
                                }
                                disabled={
                                    onlineLoading ||
                                    locationLoading
                                }
                                style={{
                                    display:
                                        "inline-flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    gap: "7px",
                                    padding:
                                        "10px 16px",
                                    border:
                                        "none",
                                    borderRadius:
                                        "8px",
                                    cursor:
                                        onlineLoading ||
                                        locationLoading
                                            ? "not-allowed"
                                            : "pointer",
                                    fontWeight:
                                        "600",
                                    background:
                                        isAvailable
                                            ? "#dc2626"
                                            : "#16a34a",
                                    color:
                                        "#fff",
                                    opacity:
                                        onlineLoading ||
                                        locationLoading
                                            ? 0.7
                                            : 1,
                                }}
                            >

                                <Power
                                    size={16}
                                />

                                {locationLoading
                                    ? "Getting Location..."
                                    : onlineLoading
                                    ? isAvailable
                                        ? "Going Offline..."
                                        : "Going Online..."
                                    : isAvailable
                                    ? "Go Offline"
                                    : "Go Online"}

                            </button>

                        </div>

                    </section>

                    {/* LOCATION INFO */}

                    {!loading &&
                        !isAvailable &&
                        !hasValidLocation() && (

                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap: "10px",
                                    padding:
                                        "12px 14px",
                                    marginBottom:
                                        "18px",
                                    borderRadius:
                                        "8px",
                                    background:
                                        "#fff7ed",
                                    border:
                                        "1px solid #fed7aa",
                                    color:
                                        "#9a3412",
                                }}
                            >

                                <Navigation
                                    size={17}
                                />

                                <span>
                                    GPS location is
                                    required before
                                    going online.
                                    Click{" "}
                                    <strong>
                                        Go Online
                                    </strong>{" "}
                                    and allow location
                                    access.
                                </span>

                            </div>
                        )}

                    {/* ERROR */}

                    {error && (

                        <div className="worker-dashboard-error">

                            <span>
                                {error}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    loadData(true)
                                }
                                disabled={
                                    refreshing
                                }
                            >

                                <RefreshCw
                                    size={13}
                                    className={
                                        refreshing
                                            ? "spin"
                                            : ""
                                    }
                                />

                                {refreshing
                                    ? "Retrying..."
                                    : "Retry"}

                            </button>

                        </div>
                    )}

                    {/* STATS */}

                    <section className="worker-stats-grid">

                        <div className="worker-stat-card">

                            <div className="worker-stat-icon">
                                <BriefcaseBusiness
                                    size={20}
                                />
                            </div>

                            <div>

                                <span>
                                    Available Jobs
                                </span>

                                <strong>
                                    {loading
                                        ? "—"
                                        : isAvailable
                                        ? nearbyJobs.length
                                        : 0}
                                </strong>

                            </div>

                        </div>

                        <div className="worker-stat-card">

                            <div className="worker-stat-icon earnings">
                                <IndianRupee
                                    size={20}
                                />
                            </div>

                            <div>

                                <span>
                                    Earnings
                                </span>

                                <strong>
                                    {loading
                                        ? "—"
                                        : `₹${totalEarnings.toLocaleString(
                                              "en-IN"
                                          )}`}
                                </strong>

                            </div>

                        </div>

                        <div className="worker-stat-card">

                            <div className="worker-stat-icon completed">
                                <CheckCircle2
                                    size={20}
                                />
                            </div>

                            <div>

                                <span>
                                    Completed Jobs
                                </span>

                                <strong>
                                    {loading
                                        ? "—"
                                        : workerCompletedJobs}
                                </strong>

                            </div>

                        </div>

                        <div className="worker-stat-card">

                            <div className="worker-stat-icon rating">
                                <Star
                                    size={20}
                                />
                            </div>

                            <div>

                                <span>
                                    My Rating
                                </span>

                                <strong>
                                    {loading
                                        ? "—"
                                        : workerRating >
                                          0
                                        ? workerRating.toFixed(
                                              1
                                          )
                                        : "0.0"}
                                </strong>

                            </div>

                        </div>

                    </section>

                    {/* NEARBY JOBS */}

                    <section className="worker-dashboard-section">

                        <div className="section-title-row">

                            <div>

                                <h2>
                                    Nearby Jobs
                                </h2>

                                <p>
                                    Available service
                                    requests in your
                                    area.
                                </p>

                            </div>

                            <div className="worker-section-actions">

                                <button
                                    type="button"
                                    className="worker-refresh-btn"
                                    onClick={() =>
                                        loadData(
                                            true
                                        )
                                    }
                                    disabled={
                                        loading ||
                                        refreshing ||
                                        !isAvailable
                                    }
                                >

                                    <RefreshCw
                                        size={13}
                                        className={
                                            refreshing
                                                ? "spin"
                                                : ""
                                        }
                                    />

                                    {refreshing
                                        ? "Refreshing"
                                        : "Refresh"}

                                </button>

                                <Link
                                    to="/worker/available-jobs"
                                    className="section-link"
                                >
                                    View All

                                    <ArrowRight
                                        size={15}
                                    />
                                </Link>

                            </div>

                        </div>

                        {!isAvailable &&
                        !loading ? (

                            <div className="worker-dashboard-empty">

                                <Power
                                    size={32}
                                />

                                <h3>
                                    You are offline
                                </h3>

                                <p>
                                    Go online to see
                                    nearby service
                                    requests.
                                </p>

                                <button
                                    type="button"
                                    className="primary-btn"
                                    onClick={
                                        toggleAvailability
                                    }
                                    disabled={
                                        onlineLoading ||
                                        locationLoading
                                    }
                                >

                                    <Power
                                        size={16}
                                    />

                                    {locationLoading
                                        ? "Getting Location..."
                                        : onlineLoading
                                        ? "Going Online..."
                                        : "Go Online"}

                                </button>

                            </div>

                        ) : loading ? (

                            <div className="worker-dashboard-empty">

                                <RefreshCw
                                    size={32}
                                    className="spin"
                                />

                                <h3>
                                    Loading nearby
                                    jobs...
                                </h3>

                                <p>
                                    Finding service
                                    requests available
                                    for you.
                                </p>

                            </div>

                        ) : error &&
                          nearbyJobs.length ===
                              0 ? (

                            <div className="worker-dashboard-empty">

                                <BriefcaseBusiness
                                    size={32}
                                />

                                <h3>
                                    Could not load
                                    nearby jobs
                                </h3>

                                <p>
                                    Check your
                                    connection and
                                    try again.
                                </p>

                                <button
                                    type="button"
                                    className="primary-btn"
                                    onClick={() =>
                                        loadData(
                                            true
                                        )
                                    }
                                >

                                    <RefreshCw
                                        size={16}
                                    />

                                    Try Again

                                </button>

                            </div>

                        ) : nearbyJobs.length ===
                          0 ? (

                            <div className="worker-dashboard-empty">

                                <BriefcaseBusiness
                                    size={32}
                                />

                                <h3>
                                    No nearby jobs
                                    right now
                                </h3>

                                <p>
                                    New service
                                    requests will
                                    appear here when
                                    they become
                                    available.
                                </p>

                            </div>

                        ) : (

                            <div className="dashboard-job-list">

                                {nearbyJobs
                                    .slice(0, 3)
                                    .map(
                                        (job) => {
                                            const jobId =
                                                job?._id ||
                                                job?.id;

                                            const {
                                                min,
                                                max,
                                            } =
                                                getJobPrices(
                                                    job
                                                );

                                            return (
                                                <Link
                                                    key={
                                                        jobId
                                                    }
                                                    to={`/worker/jobs/${jobId}`}
                                                    className="worker-job-preview"
                                                >

                                                    <div className="worker-job-preview-icon">

                                                        <BriefcaseBusiness
                                                            size={
                                                                19
                                                            }
                                                        />

                                                    </div>

                                                    <div className="worker-job-preview-content">

                                                        <span>
                                                            {job?.category ||
                                                                "Service"}
                                                        </span>

                                                        <h3>
                                                            {job?.title ||
                                                                "Untitled Job"}
                                                        </h3>

                                                        <div>

                                                            <MapPin
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            {getJobLocation(
                                                                job
                                                            )}

                                                        </div>

                                                    </div>

                                                    <div className="worker-job-preview-right">

                                                        <strong>
                                                            {min >
                                                            0
                                                                ? `₹${min}`
                                                                : "₹0"}

                                                            {" - "}

                                                            {max >
                                                            0
                                                                ? `₹${max}`
                                                                : "₹0"}
                                                        </strong>

                                                        <small>
                                                            {typeof job?.distance ===
                                                            "number"
                                                                ? `${job.distance} km`
                                                                : "Nearby"}
                                                        </small>

                                                    </div>

                                                </Link>
                                            );
                                        }
                                    )}

                            </div>

                        )}

                    </section>

                    {/* PROFILE SUMMARY */}

                    <section className="worker-profile-summary">

                        <div className="worker-profile-avatar">

                            {workerName
                                .charAt(0)
                                .toUpperCase()}

                        </div>

                        <div className="worker-profile-summary-text">

                            <span>
                                YOUR PROFILE
                            </span>

                            <h2>
                                {workerName}
                            </h2>

                            <p>

                                {Array.isArray(
                                    worker.skills
                                ) &&
                                worker.skills
                                    .length >
                                    0
                                    ? worker.skills.join(
                                          " · "
                                      )
                                    : "Service Professional"}

                                {" · "}

                                {worker.city ||
                                    "Location not added"}

                                {" · "}

                                {
                                    workerCompletedJobs
                                }{" "}
                                jobs completed

                            </p>

                        </div>

                        <Link
                            to="/worker/profile"
                            className="secondary-btn"
                        >
                            View Profile
                        </Link>

                    </section>

                    {/* ACTIVE ASSIGNMENTS */}

                    {Number(
                        statistics.activeJobs ||
                            0
                    ) > 0 && (

                        <section className="worker-dashboard-section">

                            <div className="section-title-row">

                                <div>

                                    <h2>
                                        Active
                                        Assignments
                                    </h2>

                                    <p>
                                        You currently
                                        have{" "}
                                        {
                                            statistics.activeJobs
                                        }{" "}
                                        active
                                        assignment
                                        {Number(
                                            statistics.activeJobs
                                        ) >
                                        1
                                            ? "s"
                                            : ""}
                                        .
                                    </p>

                                </div>

                                <Link
                                    to="/worker/my-jobs"
                                    className="section-link"
                                >
                                    My Jobs

                                    <ArrowRight
                                        size={15}
                                    />
                                </Link>

                            </div>

                        </section>
                    )}

                </main>
            </div>
        </div>
    );
};

export default WorkerDashboard;