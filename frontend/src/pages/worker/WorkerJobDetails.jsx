import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  IndianRupee,
  MapPin,
  Navigation,
  Phone,
  UserRound,
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
import workerJobService from "../../services/workerJobService";

const WorkerJobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadJob = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await workerJobService.getJobById(id);

        if (mounted) {
          setJob(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err?.message || "Unable to load job details.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadJob();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      !["on_the_way", "arrived"].includes(job?.status) ||
      !navigator.geolocation
    ) {
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await workerJobService.updateLocation(
            position.coords.latitude,
            position.coords.longitude
          );
        } catch (error) {
          console.error("Live location update error:", error);
        }
      },
      (error) => {
        console.error("Live location error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [job?.status]);

  // ===================================================
  // ACCEPT
  // ===================================================

  const handleAcceptJob =
    async () => {
      if (
        !job ||
        accepting
      ) {
        return;
      }

      try {
        setAccepting(true);
        setMessage("");
        setError("");

        const updated =
          await workerJobService.acceptJob(
            job.id
          );

        setJob(updated);

        setMessage(
          "Job accepted successfully."
        );
      } catch (err) {
        console.error(
          "Accept job error:",
          err
        );

        setError(
          err?.message ||
            "Unable to accept this job."
        );
      } finally {
        setAccepting(false);
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

  const getMapUrl = () => {
    const latitude = job?.location?.latitude;
    const longitude = job?.location?.longitude;
    const destination = Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude))
      ? `${latitude},${longitude}`
      : getLocation();

    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  };

  const handleStartTravel = async () => {
    try {
      setActionLoading(true);
      setError("");
      setJob(await workerJobService.startTravel(job.id));
      setMessage("Live location sharing started.");
    } catch (err) {
      setError(err?.message || "Unable to start travel.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectJob = async () => {
    try {
      setRejecting(true);
      setError("");
      await workerJobService.rejectJob(job.id);
      navigate("/worker/available-jobs", { replace: true });
    } catch (err) {
      setError(err?.message || "Unable to reject job.");
    } finally {
      setRejecting(false);
    }
  };

  const handleArrive = async () => {
    try {
      setActionLoading(true);
      setError("");
      setJob(await workerJobService.markArrived(job.id));
      setMessage("Arrival marked. Ask the customer for the start OTP.");
    } catch (err) {
      setError(err?.message || "Unable to mark arrival.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError("Enter the customer start OTP.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setJob(await workerJobService.verifyJobOTP(job.id, otp));
      setOtp("");
      setMessage("OTP verified. Live location sharing has stopped.");
    } catch (err) {
      setError(err?.message || "Unable to verify OTP.");
    } finally {
      setActionLoading(false);
    }
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
                  size={27}
                />
              </div>

              <h3>
                Unable to load job
              </h3>

              <p>{error}</p>

              <Link
                to="/worker/available-jobs"
                className="primary-btn"
              >
                <ArrowLeft size={17} />
                Back to Available Jobs
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

  const canAccept =
    !job?.assignedWorker &&
    [
      "posted",
      "searching",
    ].includes(status);

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

          {message && (
            <div className="dashboard-success">
              {message}
            </div>
          )}

          <section className="job-details-header">
            <div>
              <span className="page-eyebrow">
                JOB REQUEST
              </span>

              <h1>
                {job?.title}
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

                  <div className="detail-item">
                    <IndianRupee
                      size={19}
                    />

                    <div>
                      <span>
                        Budget
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
                        Required Skill
                      </span>

                      <strong>
                        {job?.requiredSkill ||
                          job?.category}
                      </strong>
                    </div>
                  </div>

                  {job?.distance !=
                    null && (
                    <div className="detail-item">
                      <MapPin
                        size={19}
                      />

                      <div>
                        <span>
                          Distance
                        </span>

                        <strong>
                          {job.distance} km
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {job?.customer && (
                <div className="details-card">
                  <div className="details-card-header">
                    <h2>
                      Customer
                    </h2>
                  </div>

                  <div className="worker-detail">
                    <div className="worker-avatar">
                      {job.customer.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "C"}
                    </div>

                    <div className="worker-info">
                      <strong>
                        {
                          job
                            .customer
                            .name
                        }
                      </strong>

                      <span>
                        {job
                          .customer
                          .city ||
                          ""}
                      </span>
                    </div>

                    {job.customer
                      .phone && (
                      <a
                        href={`tel:${job.customer.phone}`}
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
              )}
            </section>

            <aside className="details-side">
              <div className="details-card">
                <div className="details-card-header">
                  <h2>
                    Job Summary
                  </h2>
                </div>

                <div className="summary-list">
                  <div>
                    <span>
                      Category
                    </span>

                    <strong>
                      {job?.category}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {job?.status}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Distance
                    </span>

                    <strong>
                      {job?.distance !=
                      null
                        ? `${job.distance} km`
                        : "Nearby"}
                    </strong>
                  </div>
                </div>
              </div>

              {canAccept ? (
                <div style={{ display: "grid", gap: "8px" }}>
                  <button
                    type="button"
                    className="accept-job-btn"
                    onClick={handleAcceptJob}
                    disabled={accepting || rejecting}
                  >
                    {accepting ? "Accepting..." : "Accept Job"}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn full-width"
                    onClick={handleRejectJob}
                    disabled={accepting || rejecting}
                  >
                    {rejecting ? "Rejecting..." : "Reject Job"}
                  </button>
                </div>
              ) : job?.status === "accepted" ? (
                <>
                  <a
                    href={getMapUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="secondary-btn full-width"
                  >
                    <Navigation size={17} />
                    Navigate to Customer
                  </a>
                  <button
                    type="button"
                    className="accept-job-btn"
                    onClick={handleStartTravel}
                    disabled={actionLoading}
                  >
                    <Navigation size={17} />
                    {actionLoading ? "Starting..." : "Start Travel"}
                  </button>
                </>
              ) : job?.status === "on_the_way" ? (
                <button
                  type="button"
                  className="accept-job-btn"
                  onClick={handleArrive}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Updating..." : "I've Arrived"}
                </button>
              ) : job?.status === "arrived" ? (
                <div className="details-card">
                  <strong>Enter Customer Start OTP</strong>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="4-digit OTP"
                  />
                  <button
                    type="button"
                    className="accept-job-btn"
                    onClick={handleVerifyOTP}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Verifying..." : "Verify OTP & Start Job"}
                  </button>
                </div>
              ) : job?.status === "in_progress" ? (
                <div className="dashboard-success">
                  Service in progress. Live location sharing is off.
                </div>
              ) : (
                <div className="details-card">
                  <div className="empty-state">
                    <CheckCircle2
                      size={28}
                    />

                    <h3>
                      {job?.assignedWorker
                        ? "Job Already Assigned"
                        : "Job Not Available"}
                    </h3>
                  </div>
                </div>
              )}

              <Link
                to="/worker/my-jobs"
                className="secondary-btn full-width"
              >
                <BriefcaseBusiness
                  size={17}
                />
                My Jobs
              </Link>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WorkerJobDetails;