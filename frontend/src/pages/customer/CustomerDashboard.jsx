import {
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    Plus,
    RefreshCw,
    Users,
} from "lucide-react";

import { Link } from "react-router-dom";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import JobCard from "../../components/jobs/JobCard";
import B2BAccountPanel from "../../components/customer/B2BAccountPanel";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const CustomerDashboard = () => {
    const { user } = useAuth();

    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    const [dashboard, setDashboard] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");


    // =====================================================
    // LOAD CUSTOMER DASHBOARD
    // =====================================================

    const loadDashboard = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const token =
                    localStorage.getItem(
                        "nexserve_token"
                    );

                if (!token) {
                    throw new Error(
                        "Authentication required. Please login again."
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/customers/dashboard`,
                        {
                            method: "GET",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );

                let data = {};

                try {
                    data =
                        await response.json();
                } catch {
                    data = {};
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            "Unable to load customer dashboard."
                    );
                }

                if (!data?.success) {
                    throw new Error(
                        data?.message ||
                            "Unable to load customer dashboard."
                    );
                }

                setDashboard(
                    data.dashboard || null
                );
            } catch (err) {
                console.error(
                    "Customer dashboard error:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to load your dashboard. Please try again."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );


    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);


    // =====================================================
    // BACKEND DATA
    // =====================================================

    const statistics =
        dashboard?.statistics || {};

    const totalJobs =
        Number(
            statistics.totalJobs || 0
        );

    const activeJobs =
        Number(
            statistics.activeJobs || 0
        );

    const completedJobs =
        Number(
            statistics.completedJobs || 0
        );

    const pendingPayments =
        Number(
            statistics.pendingPayments || 0
        );

    const totalSpending =
        Number(
            statistics.totalSpending || 0
        );

    const recentJobs =
        Array.isArray(
            dashboard?.recentJobs
        )
            ? dashboard.recentJobs.slice(
                  0,
                  3
              )
            : [];

    const workersHired =
        Array.isArray(
            dashboard?.recentJobs
        )
            ? dashboard.recentJobs.filter(
                  (job) =>
                      Boolean(
                          job?.assignedWorker
                      )
              ).length
            : 0;


    // =====================================================
    // HELPERS
    // =====================================================

    const getWorkerFromJob = (job) => {
        if (!job) {
            return null;
        }

        return (
            job.assignedWorker ||
            job.worker ||
            job.assignedworker ||
            null
        );
    };


    const getLocationText = (job) => {
        if (!job) {
            return "";
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

        const location =
            job.location;

        if (
            location &&
            typeof location ===
                "object"
        ) {
            const latitude =
                location.latitude ??
                location.lat;

            const longitude =
                location.longitude ??
                location.lng ??
                location.lon;

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

        return [
            area,
            city,
        ]
            .filter(Boolean)
            .join(", ");
    };


    const normalizeJobForCard = (job) => {
        const min = Number(
            job?.budget?.min ??
                job?.estimatedMinPrice ??
                0
        );

        const max = Number(
            job?.budget?.max ??
                job?.estimatedMaxPrice ??
                0
        );

        const worker =
            getWorkerFromJob(job);

        const locationText =
            getLocationText(job);

        return {
            ...job,

            id:
                job?._id ||
                job?.id ||
                "",

            _id:
                job?._id ||
                job?.id ||
                "",

            worker,

            assignedWorker:
                job?.assignedWorker ||
                worker ||
                null,

            // IMPORTANT:
            // Never pass location object
            // directly to JobCard.
            location:
                locationText ||
                "Location not specified",

            locationText:
                locationText ||
                "Location not specified",

            budget: {
                min,
                max,
            },

            estimatedMinPrice:
                Number(
                    job?.estimatedMinPrice ??
                        min
                ),

            estimatedMaxPrice:
                Number(
                    job?.estimatedMaxPrice ??
                        max
                ),
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

                    {/* WELCOME */}

                    <section className="welcome-section">

                        <div>

                            <span className="page-eyebrow">
                                CUSTOMER DASHBOARD
                            </span>

                            <h1>
                                Welcome back,{" "}
                                {user?.name ||
                                    "Customer"}
                                !
                            </h1>

                            <p>
                                Manage your service
                                requests and find
                                trusted local workers.
                            </p>

                        </div>

                        <Link
                            to="/customer/create-job"
                            className="primary-btn"
                        >
                            <Plus size={19} />
                            Post a Job
                        </Link>

                    </section>

                    <B2BAccountPanel />


                    {/* ERROR */}

                    {error && (
                        <div className="dashboard-error">

                            <span>
                                {error}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    loadDashboard(
                                        true
                                    )
                                }
                                disabled={
                                    refreshing
                                }
                            >
                                {refreshing ? (
                                    "Retrying..."
                                ) : (
                                    <>
                                        <RefreshCw
                                            size={12}
                                        />
                                        Retry
                                    </>
                                )}
                            </button>

                        </div>
                    )}


                    {/* STATS */}

                    <section className="stats-grid">

                        <div className="stat-card">

                            <div className="stat-icon">
                                <BriefcaseBusiness
                                    size={22}
                                />
                            </div>

                            <div>
                                <span>
                                    Total Jobs
                                </span>

                                <strong>
                                    {loading
                                        ? "—"
                                        : totalJobs}
                                </strong>
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon">
                                <Clock3
                                    size={22}
                                />
                            </div>

                            <div>
                                <span>
                                    Active Jobs
                                </span>

                                <strong>
                                    {loading
                                        ? "—"
                                        : activeJobs}
                                </strong>
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon">
                                <CheckCircle2
                                    size={22}
                                />
                            </div>

                            <div>
                                <span>
                                    Completed
                                </span>

                                <strong>
                                    {loading
                                        ? "—"
                                        : completedJobs}
                                </strong>
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon">
                                <Users
                                    size={22}
                                />
                            </div>

                            <div>
                                <span>
                                    Workers Hired
                                </span>

                                <strong>
                                    {loading
                                        ? "—"
                                        : workersHired}
                                </strong>
                            </div>

                        </div>

                    </section>


                    {/* ACCOUNT OVERVIEW */}

                    {!loading && !error && (
                        <section className="dashboard-section">

                            <div className="section-header">

                                <div>

                                    <h2>
                                        Account Overview
                                    </h2>

                                    <p>
                                        Your current
                                        spending and
                                        payment status
                                    </p>

                                </div>

                            </div>


                            <div className="stats-grid">

                                <div className="stat-card">

                                    <div className="stat-icon">
                                        <BriefcaseBusiness
                                            size={22}
                                        />
                                    </div>

                                    <div>

                                        <span>
                                            Total Spending
                                        </span>

                                        <strong>
                                            ₹
                                            {totalSpending.toLocaleString(
                                                "en-IN"
                                            )}
                                        </strong>

                                    </div>

                                </div>


                                <div className="stat-card">

                                    <div className="stat-icon">
                                        <Clock3
                                            size={22}
                                        />
                                    </div>

                                    <div>

                                        <span>
                                            Pending Payments
                                        </span>

                                        <strong>
                                            {
                                                pendingPayments
                                            }
                                        </strong>

                                    </div>

                                </div>

                            </div>

                        </section>
                    )}


                    {/* RECENT JOBS */}

                    <section className="dashboard-section">

                        <div className="section-header">

                            <div>

                                <h2>
                                    Recent Jobs
                                </h2>

                                <p>
                                    Your latest service
                                    requests
                                </p>

                            </div>


                            <div className="section-header-actions">

                                <button
                                    type="button"
                                    className="section-refresh-btn"
                                    onClick={() =>
                                        loadDashboard(
                                            true
                                        )
                                    }
                                    disabled={
                                        loading ||
                                        refreshing
                                    }
                                    title="Refresh dashboard"
                                >
                                    <RefreshCw
                                        size={14}
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
                                    to="/customer/my-jobs"
                                    className="section-link"
                                >
                                    View All
                                    <ArrowRight
                                        size={17}
                                    />
                                </Link>

                            </div>

                        </div>


                        {loading ? (

                            <div className="empty-state">

                                <div className="dashboard-loading-spinner" />

                                <h3>
                                    Loading your
                                    dashboard...
                                </h3>

                                <p>
                                    Getting your latest
                                    service requests.
                                </p>

                            </div>

                        ) : error &&
                          recentJobs.length ===
                              0 ? (

                            <div className="empty-state">

                                <BriefcaseBusiness
                                    size={40}
                                />

                                <h3>
                                    Could not load
                                    dashboard
                                </h3>

                                <p>
                                    Something went wrong
                                    while loading your
                                    service requests.
                                </p>

                                <button
                                    type="button"
                                    className="primary-btn"
                                    onClick={() =>
                                        loadDashboard(
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

                        ) : recentJobs.length ===
                          0 ? (

                            <div className="empty-state">

                                <BriefcaseBusiness
                                    size={40}
                                />

                                <h3>
                                    No jobs yet
                                </h3>

                                <p>
                                    Create your first
                                    service request and
                                    connect with a local
                                    worker.
                                </p>

                                <Link
                                    to="/customer/create-job"
                                    className="primary-btn"
                                >
                                    <Plus
                                        size={18}
                                    />
                                    Post Your First Job
                                </Link>

                            </div>

                        ) : (

                            <div className="jobs-grid">

                                {recentJobs.map(
                                    (job) => (
                                        <JobCard
                                            key={
                                                job?._id ||
                                                job?.id
                                            }
                                            job={normalizeJobForCard(
                                                job
                                            )}
                                        />
                                    )
                                )}

                            </div>
                        )}

                    </section>


                    {/* QUICK ACTION */}

                    <section className="quick-actions">

                        <div className="quick-action-card">

                            <div>

                                <span className="page-eyebrow">
                                    NEED A SERVICE?
                                </span>

                                <h2>
                                    Find the right
                                    worker for your
                                    job.
                                </h2>

                                <p>
                                    Post your requirement
                                    and get connected
                                    with nearby skilled
                                    professionals.
                                </p>

                            </div>


                            <Link
                                to="/customer/create-job"
                                className="primary-btn"
                            >
                                Create Job
                                <ArrowRight
                                    size={18}
                                />
                            </Link>

                        </div>

                    </section>

                </main>

            </div>

        </div>
    );
};

export default CustomerDashboard;