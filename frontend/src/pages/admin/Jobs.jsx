import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import adminService from "../../services/adminService";

const Jobs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminService.fetchJobs();

        if (!isMounted) return;

        const normalizedJobs = Array.isArray(response?.jobs)
          ? response.jobs.map((job) => ({
              id: job.id || job._id,
              title: job.title || "Untitled Job",
              customer: job.customer || "Customer",
              worker: job.worker || "Not Assigned",
              category: job.category || "General",
              location: job.location || "Location unavailable",
              amount: Number(job.amount || 0),
              status: adminService.normalizeStatus(job.status),
              date: adminService.formatDate(job.date || job.createdAt),
            }))
          : [];

        setJobs(normalizedJobs);
      } catch (loadError) {
        if (!isMounted) return;
        setJobs([]);
        setError(loadError?.message || "Unable to load jobs.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        String(job.id).toLowerCase().includes(query) ||
        job.title.toLowerCase().includes(query) ||
        job.customer.toLowerCase().includes(query) ||
        job.worker.toLowerCase().includes(query) ||
        job.category.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query);

      const matchesFilter = filter === "All" || job.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [jobs, search, filter]);

  const updateStatus = (id, status) => {
    setJobs((previous) =>
      previous.map((job) => (job.id === id ? { ...job, status } : job))
    );
  };

  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter((job) => job.status === "Pending").length;
  const activeJobs = jobs.filter((job) => job.status === "In Progress").length;
  const completedJobs = jobs.filter((job) => job.status === "Completed").length;
  const totalRevenue = jobs
    .filter((job) => job.status === "Completed")
    .reduce((total, job) => total + Number(job.amount || 0), 0);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-area">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="dashboard-content">
          <section className="page-heading-row">
            <div>
              <span className="page-eyebrow">ADMIN PANEL</span>
              <h1>Jobs Management</h1>
              <p>Monitor and manage all jobs posted on the platform.</p>
            </div>

            <div className="jobs-admin-live">
              <BriefcaseBusiness size={14} />
              {totalJobs} Total Jobs
            </div>
          </section>

          {error && <div className="form-error">{error}</div>}

          <section className="jobs-admin-summary">
            <div className="jobs-admin-summary-card">
              <div className="jobs-admin-summary-icon blue">
                <BriefcaseBusiness size={19} />
              </div>

              <div>
                <span>Total Jobs</span>
                <strong>{totalJobs}</strong>
              </div>
            </div>

            <div className="jobs-admin-summary-card">
              <div className="jobs-admin-summary-icon orange">
                <Clock3 size={19} />
              </div>

              <div>
                <span>Pending</span>
                <strong>{pendingJobs}</strong>
              </div>
            </div>

            <div className="jobs-admin-summary-card">
              <div className="jobs-admin-summary-icon purple">
                <MapPin size={19} />
              </div>

              <div>
                <span>In Progress</span>
                <strong>{activeJobs}</strong>
              </div>
            </div>

            <div className="jobs-admin-summary-card">
              <div className="jobs-admin-summary-icon green">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <span>Completed</span>
                <strong>{completedJobs}</strong>
              </div>
            </div>

            <div className="jobs-admin-summary-card revenue">
              <div className="jobs-admin-summary-icon green">₹</div>

              <div>
                <span>Completed Value</span>
                <strong>₹{totalRevenue.toLocaleString()}</strong>
              </div>
            </div>
          </section>

          <section className="jobs-admin-panel">
            <div className="jobs-admin-toolbar">
              <div className="jobs-admin-search">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search job, customer, worker, category..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="jobs-admin-filters">
                {[
                  "All",
                  "Pending",
                  "In Progress",
                  "Completed",
                  "Cancelled",
                ].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={filter === item ? "active" : ""}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="jobs-admin-table-wrapper">
              <div className="jobs-admin-table-head">
                <span>JOB</span>
                <span>CUSTOMER</span>
                <span>WORKER</span>
                <span>CATEGORY</span>
                <span>LOCATION</span>
                <span>AMOUNT</span>
                <span>STATUS</span>
                <span>ACTION</span>
              </div>

              {loading ? (
                <div className="users-empty">
                  <BriefcaseBusiness size={24} />
                  <strong>Loading jobs...</strong>
                  <span>Please wait while data loads.</span>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="users-empty">
                  <Search size={24} />
                  <strong>No jobs found</strong>
                  <span>Try changing your search or filter.</span>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div className="jobs-admin-table-row" key={job.id}>
                    <div className="jobs-admin-job-cell">
                      <div className="jobs-admin-job-icon">
                        <BriefcaseBusiness size={15} />
                      </div>

                      <div>
                        <strong>{job.title}</strong>
                        <span>{String(job.id).slice(-6)}</span>
                      </div>
                    </div>

                    <span>{job.customer}</span>
                    <span>{job.worker}</span>
                    <span>{job.category}</span>
                    <span>{job.location}</span>
                    <strong>₹{job.amount.toLocaleString()}</strong>
                    <span className={`jobs-admin-status ${String(job.status).toLowerCase().replace(/\s+/g, "-")}`}>
                      {job.status}
                    </span>
                    <div className="jobs-admin-action">
                      <button type="button" className="jobs-admin-see-btn" onClick={() => updateStatus(job.id, "Completed")}>
                        <Eye size={13} />
                        View
                      </button>
                      <button type="button" className="jobs-admin-cancel-btn" onClick={() => updateStatus(job.id, "Cancelled")}>
                        <XCircle size={13} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Jobs;