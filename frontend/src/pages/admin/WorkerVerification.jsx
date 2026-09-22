import {
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import adminService from "../../services/adminService";

const WorkerVerification = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Pending");
  const [error, setError] = useState("");

  const [workers, setWorkers] = useState([
    {
      id: "WRK1001",
      name: "Amit Sharma",
      phone: "9876543213",
      skill: "Plumber",
      location: "Pipraich, Gorakhpur",
      experience: "6 years",
      status: "Approved",
      documents: "Verified",
      applied: "28 Aug 2026",
    },
    {
      id: "WRK1002",
      name: "Ravi Kumar",
      phone: "9876543221",
      skill: "Electrician",
      location: "Gorakhpur",
      experience: "4 years",
      status: "Pending",
      documents: "Submitted",
      applied: "27 Aug 2026",
    },
    {
      id: "WRK1003",
      name: "Suresh Yadav",
      phone: "9876543234",
      skill: "Plumber",
      location: "Gorakhpur",
      experience: "7 years",
      status: "Approved",
      documents: "Verified",
      applied: "25 Aug 2026",
    },
    {
      id: "WRK1004",
      name: "Deepak Singh",
      phone: "9876543240",
      skill: "AC Technician",
      location: "Gorakhpur",
      experience: "5 years",
      status: "Pending",
      documents: "Submitted",
      applied: "24 Aug 2026",
    },
    {
      id: "WRK1005",
      name: "Vikas Singh",
      phone: "9876543248",
      skill: "Carpenter",
      location: "Pipraich",
      experience: "3 years",
      status: "Rejected",
      documents: "Incomplete",
      applied: "22 Aug 2026",
    },
  ]);

  useEffect(() => {
    adminService.fetchVerificationQueue().then(({ workers: queue }) => {
      setWorkers((queue || []).map((worker) => ({
        id: worker._id,
        name: worker.name,
        phone: worker.phone,
        skill: worker.skills?.[0] || "Professional",
        location: [worker.area, worker.city].filter(Boolean).join(", "),
        experience: `${worker.experience || 0} years`,
        status: worker.verificationStatus === "approved" ? "Approved" : worker.verificationStatus === "rejected" ? "Rejected" : "Pending",
        documents: worker.certificates?.length ? `${worker.certificates.length} submitted` : "Missing",
        applied: worker.verificationSubmittedAt,
      })));
    }).catch((loadError) => setError(loadError.message));
  }, []);

  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchesSearch =
        worker.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        worker.phone.includes(search) ||
        worker.skill
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        worker.id
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        worker.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [workers, search, filter]);

  const updateWorkerStatus = async (id, status) => {
    try {
      await adminService.updateVerification(id, status.toLowerCase());
      setError("");
    } catch (updateError) {
      setError(updateError.message);
      return;
    }
    setWorkers((previous) =>
      previous.map((worker) =>
        worker.id === id
          ? {
              ...worker,
              status,
              documents:
                status === "Approved"
                  ? "Verified"
                  : worker.documents,
            }
          : worker
      )
    );
  };

  const pending = workers.filter(
    (worker) => worker.status === "Pending"
  ).length;

  const approved = workers.filter(
    (worker) => worker.status === "Approved"
  ).length;

  const rejected = workers.filter(
    (worker) => worker.status === "Rejected"
  ).length;

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-area">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="dashboard-content">
          {error && <div className="dashboard-error">{error}</div>}

          <section className="page-heading-row">
            <div>
              <span className="page-eyebrow">
                ADMIN PANEL
              </span>

              <h1>Worker Verification</h1>

              <p>
                Review worker applications and verify
                their professional information.
              </p>
            </div>

            <div className="verification-status">
              <ShieldCheck size={15} />
              Verification Center
            </div>
          </section>

          <section className="verification-summary-grid">
            <div className="verification-summary-card pending">
              <div className="verification-summary-icon">
                <Clock3 size={19} />
              </div>

              <div>
                <span>Pending Review</span>
                <strong>{pending}</strong>
              </div>
            </div>

            <div className="verification-summary-card approved">
              <div className="verification-summary-icon">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <span>Approved Workers</span>
                <strong>{approved}</strong>
              </div>
            </div>

            <div className="verification-summary-card rejected">
              <div className="verification-summary-icon">
                <XCircle size={19} />
              </div>

              <div>
                <span>Rejected</span>
                <strong>{rejected}</strong>
              </div>
            </div>

            <div className="verification-summary-card total">
              <div className="verification-summary-icon">
                <UserRound size={19} />
              </div>

              <div>
                <span>Total Applications</span>
                <strong>{workers.length}</strong>
              </div>
            </div>
          </section>

          <section className="verification-panel">
            <div className="verification-toolbar">
              <div className="verification-search">
                <Search size={15} />

                <input
                  type="text"
                  placeholder="Search worker, skill, phone or ID..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <div className="verification-filters">
                {[
                  "All",
                  "Pending",
                  "Approved",
                  "Rejected",
                ].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={
                      filter === item ? "active" : ""
                    }
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="verification-table-wrapper">
              <div className="verification-table-head">
                <span>WORKER</span>
                <span>SERVICE</span>
                <span>LOCATION</span>
                <span>DOCUMENTS</span>
                <span>STATUS</span>
                <span>ACTION</span>
              </div>

              {filteredWorkers.length === 0 ? (
                <div className="verification-empty">
                  <Search size={24} />

                  <strong>
                    No workers found
                  </strong>

                  <span>
                    Try another search or filter.
                  </span>
                </div>
              ) : (
                filteredWorkers.map((worker) => (
                  <div
                    className="verification-table-row"
                    key={worker.id}
                  >
                    <div className="verification-worker">
                      <div className="verification-avatar">
                        {worker.name.charAt(0)}
                      </div>

                      <div>
                        <strong>{worker.name}</strong>

                        <span>{worker.id}</span>

                        <small>
                          {worker.experience} experience
                        </small>
                      </div>
                    </div>

                    <div className="verification-service">
                      <strong>{worker.skill}</strong>

                      <span>{worker.phone}</span>
                    </div>

                    <span className="verification-location">
                      {worker.location}
                    </span>

                    <span
                      className={`document-status ${worker.documents
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      <FileCheck2 size={11} />
                      {worker.documents}
                    </span>

                    <span
                      className={`verification-worker-status ${worker.status.toLowerCase()}`}
                    >
                      {worker.status}
                    </span>

                    <div className="verification-actions">
                      <button
                        type="button"
                        className="view-worker-btn"
                        title="View details"
                        onClick={() =>
                          alert(
                            `${worker.name}\n${worker.skill}\n${worker.location}\n${worker.experience}`
                          )
                        }
                      >
                        <Eye size={13} />
                      </button>

                      {worker.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            className="approve-worker-btn"
                            onClick={() =>
                              updateWorkerStatus(
                                worker.id,
                                "Approved"
                              )
                            }
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            className="reject-worker-btn"
                            onClick={() =>
                              updateWorkerStatus(
                                worker.id,
                                "Rejected"
                              )
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {worker.status === "Rejected" && (
                        <button
                          type="button"
                          className="approve-worker-btn"
                          onClick={() =>
                            updateWorkerStatus(
                              worker.id,
                              "Approved"
                            )
                          }
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="verification-footer">
              <span>
                Showing {filteredWorkers.length} of{" "}
                {workers.length} applications
              </span>

              <span>
                Document verification will be connected
                to the backend later.
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default WorkerVerification;