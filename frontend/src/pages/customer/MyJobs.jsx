import {
  BriefcaseBusiness,
  ChevronRight,
  MapPin,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import StatusBadge from "../../components/jobs/StatusBadge";
import jobService from "../../services/jobService";

const MyJobs = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  // ===================================================
  // LOAD REAL CUSTOMER JOBS
  // ===================================================

  const loadJobs = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data =
          await jobService.getMyJobs();

        setJobs(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Customer My Jobs error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load your jobs."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredJobs =
    useMemo(() => {
      const text =
        search
          .toLowerCase()
          .trim();

      if (!text) {
        return jobs;
      }

      return jobs.filter((job) => {
        return (
          job.title
            ?.toLowerCase()
            .includes(text) ||
          job.category
            ?.toLowerCase()
            .includes(text) ||
          job.description
            ?.toLowerCase()
            .includes(text) ||
          job.location
            ?.toLowerCase()
            .includes(text) ||
          String(job.id)
            .toLowerCase()
            .includes(text)
        );
      });
    }, [jobs, search]);

  // ===================================================
  // COUNTS
  // ===================================================

  const postedCount =
    jobs.filter((job) =>
      [
        "posted",
        "searching",
      ].includes(
        String(
          job.status || ""
        ).toLowerCase()
      )
    ).length;

  const activeCount =
    jobs.filter((job) =>
      [
        "accepted",
        "on_the_way",
        "in_progress",
      ].includes(
        String(
          job.status || ""
        ).toLowerCase()
      )
    ).length;

  const completedCount =
    jobs.filter(
      (job) =>
        String(
          job.status || ""
        ).toLowerCase() ===
        "completed"
    ).length;

  // ===================================================
  // LOCATION
  // ===================================================

  const getLocation = (job) => {
    if (
      typeof job.location ===
      "string"
    ) {
      return job.location;
    }

    if (
      job.location &&
      typeof job.location ===
        "object"
    ) {
      return (
        job.location.address ||
        job.location.area ||
        job.location.city ||
        "Location not specified"
      );
    }

    return [
      job.area,
      job.city,
    ]
      .filter(Boolean)
      .join(", ") ||
      "Location not specified";
  };

  // ===================================================
  // DATE
  // ===================================================

  const getDate = (job) => {
    if (!job.createdAt) {
      return "Recently posted";
    }

    const date =
      new Date(job.createdAt);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Recently posted";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

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
          <section className="page-heading-row">
            <div>
              <span className="page-eyebrow">
                CUSTOMER REQUESTS
              </span>

              <h1>My Jobs</h1>

              <p>
                Aapke dwara post kiye
                gaye saare service requests
                yahan dikh rahe hain.
              </p>
            </div>

            <Link
              to="/customer/create-job"
              className="primary-btn"
            >
              <Plus size={18} />
              Post New Job
            </Link>
          </section>

          {/* =================================================
              STATS
          ================================================= */}

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <BriefcaseBusiness
                  size={21}
                />
              </div>

              <div>
                <span>Total Jobs</span>

                <strong>
                  {loading
                    ? "—"
                    : jobs.length}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Search size={21} />
              </div>

              <div>
                <span>Searching</span>

                <strong>
                  {loading
                    ? "—"
                    : postedCount}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <BriefcaseBusiness
                  size={21}
                />
              </div>

              <div>
                <span>Active</span>

                <strong>
                  {loading
                    ? "—"
                    : activeCount}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <RefreshCw size={21} />
              </div>

              <div>
                <span>Completed</span>

                <strong>
                  {loading
                    ? "—"
                    : completedCount}
                </strong>
              </div>
            </div>
          </section>

          {/* =================================================
              SEARCH
          ================================================= */}

          <section className="jobs-toolbar">
            <div className="jobs-search">
              <Search size={17} />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search your jobs..."
              />
            </div>

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                loadJobs(true)
              }
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="dashboard-error">
              <span>{error}</span>

              <button
                type="button"
                onClick={() =>
                  loadJobs(true)
                }
              >
                Try Again
              </button>
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="jobs-page-empty">
              <div className="dashboard-loading-spinner" />

              <h3>
                Loading your jobs...
              </h3>

              <p>
                Getting your latest
                service requests.
              </p>
            </div>
          ) : filteredJobs.length ===
            0 ? (
            <div className="jobs-page-empty">
              <div className="empty-job-icon">
                <BriefcaseBusiness
                  size={27}
                />
              </div>

              <h3>
                {jobs.length === 0
                  ? "No jobs posted yet"
                  : "No matching jobs"}
              </h3>

              <p>
                {jobs.length === 0
                  ? "Post your first service request to get started."
                  : "Try another search."}
              </p>

              {jobs.length === 0 && (
                <Link
                  to="/customer/create-job"
                  className="primary-btn"
                >
                  <Plus size={17} />
                  Post a Job
                </Link>
              )}
            </div>
          ) : (
            <section className="my-jobs-list">
              {filteredJobs.map(
                (job) => (
                  <article
                    key={
                      job.id
                    }
                    className="my-job-card"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(
                        `/customer/jobs/${job.id}`
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        event.preventDefault();

                        navigate(
                          `/customer/jobs/${job.id}`
                        );
                      }
                    }}
                  >
                    <div className="my-job-main">
                      <div className="my-job-icon">
                        <BriefcaseBusiness
                          size={21}
                        />
                      </div>

                      <div className="my-job-content">
                        <div className="my-job-title-row">
                          <div>
                            <span className="job-category">
                              {job.category ||
                                "Service"}
                            </span>

                            <h2>
                              {job.title}
                            </h2>
                          </div>

                          <StatusBadge
                            status={
                              job.status ||
                              "posted"
                            }
                          />
                        </div>

                        <p className="my-job-description">
                          {job.description ||
                            "No description provided."}
                        </p>

                        <div className="my-job-meta">
                          <span>
                            <MapPin
                              size={15}
                            />

                            {getLocation(
                              job
                            )}
                          </span>

                          <span>
                            ₹
                            {job.budget
                              ?.min ??
                              0}
                            {" - ₹"}
                            {job.budget
                              ?.max ??
                              0}
                          </span>

                          <span>
                            {getDate(
                              job
                            )}
                          </span>
                        </div>

                        {job.assignedWorker && (
                          <div className="my-job-worker">
                            Worker:{" "}
                            <strong>
                              {
                                job
                                  .assignedWorker
                                  .name
                              }
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="my-job-arrow">
                      <ChevronRight
                        size={20}
                      />
                    </div>
                  </article>
                )
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyJobs;