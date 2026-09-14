import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  IndianRupee,
  MapPin,
  Phone,
  Search,
  Trash2,
  User,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import StatusBadge from "../../components/jobs/StatusBadge";
import jobService from "../../services/jobService";

const JobDetails = () => {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [job, setJob] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [cancelling, setCancelling] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  // ===================================================
  // LOAD REAL JOB
  // ===================================================

  const loadJob = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await jobService.getJobById(
          id
        );

      setJob(data);
    } catch (err) {
      console.error(
        "Customer job details error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load job details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  useEffect(() => {
    if (
      !job ||
      !["on_the_way", "arrived"].includes(
        String(job.status || "").toLowerCase()
      )
    ) {
      return undefined;
    }

    const refreshTimer = setInterval(loadJob, 10000);

    return () => clearInterval(refreshTimer);
  }, [job?.status, id]);

  // ===================================================
  // CANCEL
  // ===================================================

  const handleCancel = async () => {
    if (
      !job ||
      cancelling
    ) {
      return;
    }

    const status =
      String(
        job.status || ""
      ).toLowerCase();

    if (
      ![
        "posted",
        "searching",
      ].includes(status)
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this job?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);
      setError("");

      const updated =
        await jobService.cancelJob(
          job.id
        );

      setJob(updated);
    } catch (err) {
      console.error(
        "Cancel job error:",
        err
      );

      setError(
        err?.message ||
          "Unable to cancel job."
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!job || deleting) {
      return;
    }

    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      await jobService.deleteJob(job.id);
      navigate("/customer/my-jobs", { replace: true });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to delete job."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===================================================
  // LOCATION
  // ===================================================

  const getLocation = () => {
    if (
      typeof job?.location ===
      "string"
    ) {
      return job.location;
    }

    if (
      job?.location &&
      typeof job.location ===
        "object"
    ) {
      if (job.address) {
        return job.address;
      }

      return (
        job.location.address ||
        job.location.area ||
        job.location.city ||
        "Location not specified"
      );
    }

    return [
      job?.area,
      job?.city,
    ]
      .filter(Boolean)
      .join(", ") ||
      "Location not specified";
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
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
            <div className="jobs-page-empty">
              <div className="dashboard-loading-spinner" />

              <h3>
                Loading job details...
              </h3>

              <p>
                Getting the latest
                information.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error && !job) {
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
            <div className="jobs-page-empty">
              <div className="empty-job-icon">
                <BriefcaseBusiness
                  size={26}
                />
              </div>

              <h3>
                Unable to load job
              </h3>

              <p>{error}</p>

              <Link
                to="/customer/my-jobs"
                className="primary-btn"
              >
                <ArrowLeft size={17} />
                Back to My Jobs
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const status =
    String(
      job?.status || ""
    ).toLowerCase();

  const canCancel =
    [
      "posted",
      "searching",
    ].includes(status);

  const worker =
    job?.assignedWorker ||
    job?.worker ||
    null;

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
          <button
            type="button"
            className="back-btn"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

          {job?.status === "arrived" && (
            <div className="dashboard-success">
              Worker has arrived. Share the start OTP with the worker.
            </div>
          )}

          {job?.otp && ["on_the_way", "arrived"].includes(job.status) && (
            <div className="details-card">
              <strong>Service Start OTP</strong>
              <p>Share this one-time code only when the worker arrives.</p>
              <strong style={{ fontSize: "28px", letterSpacing: "4px" }}>
                {job.otp}
              </strong>
            </div>
          )}

          <section className="job-details-header">
            <div>
              <span className="page-eyebrow">
                JOB DETAILS
              </span>

              <h1>
                {job?.title ||
                  "Job Details"}
              </h1>

              <p>
                Job ID:{" "}
                <strong>
                  {job?.id}
                </strong>
              </p>
            </div>

            <StatusBadge
              status={
                job?.status ||
                "posted"
              }
            />
          </section>

          <div className="details-layout">
            <section className="details-main">
              {/* JOB INFORMATION */}

              <div className="details-card">
                <div className="details-card-header">
                  <h2>
                    Job Information
                  </h2>
                </div>

                <div className="details-description">
                  <span>
                    Description
                  </span>

                  <p>
                    {job?.description ||
                      "No description provided."}
                  </p>
                </div>

                <div className="details-info-grid">
                  <div className="detail-item">
                    <MapPin size={19} />

                    <div>
                      <span>
                        Location
                      </span>

                      <strong>
                        {getLocation()}
                      </strong>
                    </div>
                  </div>

                  {job?.liveTrackingActive &&
                    job?.workerLiveLocation && (
                    <div className="detail-item">
                      <MapPin size={19} />
                      <div>
                        <span>Worker Live Location</span>
                        <strong>
                          {Number(job.workerLiveLocation.latitude).toFixed(5)}, {Number(job.workerLiveLocation.longitude).toFixed(5)}
                        </strong>
                      </div>
                    </div>
                  )}

                  <div className="detail-item">
                    <IndianRupee
                      size={19}
                    />

                    <div>
                      <span>
                        Estimated Budget
                      </span>

                      <strong>
                        ₹
                        {job?.budget
                          ?.min ??
                          0}
                        {" - ₹"}
                        {job?.budget
                          ?.max ??
                          0}
                      </strong>
                    </div>
                  </div>

                  <div className="detail-item">
                    <CheckCircle2
                      size={19}
                    />

                    <div>
                      <span>
                        Current Status
                      </span>

                      <strong>
                        {job?.status}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* WORKER */}

              {worker ? (
                <div className="details-card">
                  <div className="details-card-header">
                    <h2>
                      Assigned Worker
                    </h2>
                  </div>

                  <div className="worker-detail">
                    <div className="worker-avatar">
                      {worker.name
                        ?.charAt(
                          0
                        )
                        ?.toUpperCase() ||
                        "W"}
                    </div>

                    <div className="worker-info">
                      <strong>
                        {worker.name ||
                          "Worker"}
                      </strong>

                      <span>
                        Rating:{" "}
                        {worker.rating ??
                          "N/A"}{" "}
                        / 5
                      </span>
                    </div>

                    {worker.phone && (
                      <a
                        href={`tel:${worker.phone}`}
                        className="call-btn"
                      >
                        <Phone
                          size={17}
                        />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="details-card">
                  <div className="details-card-header">
                    <h2>
                      Worker Status
                    </h2>
                  </div>

                  <div className="empty-state">
                    <Search
                      size={30}
                    />

                    <h3>
                      Looking for a worker
                    </h3>

                    <p>
                      Your job is visible
                      to matching nearby
                      workers.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <aside className="details-side">
              {/* CUSTOMER */}

              <div className="details-card">
                <div className="details-card-header">
                  <h2>
                    Request Summary
                  </h2>
                </div>

                <div className="summary-list">
                  <div>
                    <span>
                      Category
                    </span>

                    <strong>
                      {job?.category ||
                        "Service"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Required Skill
                    </span>

                    <strong>
                      {job?.requiredSkill ||
                        "Auto matched"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Worker
                    </span>

                    <strong>
                      {worker?.name ||
                        "Not assigned"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              {canCancel && (
                <>
                  <button
                    type="button"
                    className="secondary-btn full-width"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Job"}
                  </button>

                  <button
                    type="button"
                    className="secondary-btn full-width"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 size={17} />
                    {deleting ? "Deleting..." : "Delete Job"}
                  </button>
                </>
              )}

              <Link
                to="/customer/my-jobs"
                className="secondary-btn full-width"
              >
                <BriefcaseBusiness
                  size={17}
                />
                View All My Jobs
              </Link>

              <Link
                to={`/workers?jobId=${job?.id}`}
                className="primary-btn full-width"
              >
                <Search size={17} />
                Find Worker
              </Link>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobDetails;