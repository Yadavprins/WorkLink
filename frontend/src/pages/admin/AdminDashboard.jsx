import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Users,
  UserRoundCheck,
  UserRoundCog,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import adminService from "../../services/adminService";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState({
    stats: { customers: 0, workers: 0, jobs: 0, completed: 0 },
    recentJobs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminService.fetchDashboard();

        if (!isMounted) return;

        setDashboard({
          stats: response?.stats || { customers: 0, workers: 0, jobs: 0, completed: 0 },
          recentJobs: Array.isArray(response?.recentJobs) ? response.recentJobs : [],
        });
      } catch (loadError) {
        if (!isMounted) return;

        setError(loadError?.message || "Unable to load dashboard data.");
        setDashboard({
          stats: { customers: 0, workers: 0, jobs: 0, completed: 0 },
          recentJobs: [],
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        title: "Total Users",
        value: dashboard.stats.customers?.toLocaleString() || "0",
        change: "+12.8%",
        icon: Users,
        type: "blue",
      },
      {
        title: "Active Workers",
        value: dashboard.stats.workers?.toLocaleString() || "0",
        change: "+8.4%",
        icon: UserRoundCheck,
        type: "green",
      },
      {
        title: "Total Jobs",
        value: dashboard.stats.jobs?.toLocaleString() || "0",
        change: "+16.2%",
        icon: BriefcaseBusiness,
        type: "orange",
      },
      {
        title: "Platform Revenue",
        value: `₹${Math.max(0, Number(dashboard.stats.completed || 0) * 120).toLocaleString()}`,
        change: "+21.5%",
        icon: IndianRupee,
        type: "purple",
      },
    ],
    [dashboard]
  );

  const recentJobs = useMemo(
    () =>
      dashboard.recentJobs.map((job) => ({
        id: job._id || job.id || "JOB-UNKNOWN",
        title: job.title || "Untitled Job",
        customer: job.customer?.name || "Customer",
        worker: job.assignedWorker?.name || "Not Assigned",
        amount: Number(job.finalPrice || job.workerQuote || job.estimatedMaxPrice || 0),
        status: job.status || "pending",
      })),
    [dashboard.recentJobs]
  );

  const activities = [
    {
      icon: UserRoundCheck,
      text: "New worker registered",
      name: "Live data pending",
      time: "Waiting for backend",
    },
    {
      icon: BriefcaseBusiness,
      text: "New job posted",
      name: recentJobs[0]?.title || "No recent jobs",
      time: "Latest sync",
    },
    {
      icon: CheckCircle2,
      text: "Jobs completed",
      name: `${dashboard.stats.completed || 0} total completed`,
      time: "Current snapshot",
    },
    {
      icon: UserRoundCog,
      text: "Workers on platform",
      name: `${dashboard.stats.workers || 0} active workers`,
      time: "Current snapshot",
    },
  ];

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-area">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="dashboard-content">
          <section className="page-heading-row">
            <div>
              <span className="page-eyebrow">ADMIN PANEL</span>
              <h1>Dashboard</h1>
              <p>Monitor NexServe activity, users and platform performance.</p>
            </div>

            <div className="admin-live-status">
              <span />
              {loading ? "Loading data..." : error ? "Fallback mode" : "System Operational"}
            </div>
          </section>

          {error && <div className="form-error">{error}</div>}

          <section className="admin-stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div className="admin-stat-card" key={stat.title}>
                  <div className={`admin-stat-icon ${stat.type}`}>
                    <Icon size={21} />
                  </div>

                  <div className="admin-stat-content">
                    <span>{stat.title}</span>
                    <strong>{stat.value}</strong>
                    <small>
                      <ArrowUpRight size={11} />
                      {stat.change} this month
                    </small>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="admin-main-grid">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Recent Jobs</h2>
                  <p>Latest activity across the platform.</p>
                </div>

                <button type="button" className="admin-view-btn">View All</button>
              </div>

              <div className="admin-jobs-table">
                <div className="admin-table-head">
                  <span>JOB</span>
                  <span>CUSTOMER</span>
                  <span>WORKER</span>
                  <span>AMOUNT</span>
                  <span>STATUS</span>
                </div>

                {recentJobs.length === 0 ? (
                  <div className="users-empty">
                    <BriefcaseBusiness size={24} />
                    <strong>No recent jobs</strong>
                    <span>Data will appear here once jobs are created.</span>
                  </div>
                ) : (
                  recentJobs.map((job) => (
                    <div className="admin-table-row" key={job.id}>
                      <div className="admin-job-cell">
                        <div className="admin-job-icon">
                          <BriefcaseBusiness size={15} />
                        </div>

                        <div>
                          <strong>{job.title}</strong>
                          <span>{String(job.id).slice(-6)}</span>
                        </div>
                      </div>

                      <span>{job.customer}</span>
                      <span>{job.worker}</span>
                      <strong>₹{job.amount.toLocaleString()}</strong>
                      <span className={`admin-job-status ${String(job.status).toLowerCase().replace(/\s+/g, "-")}`}>
                        {job.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="admin-panel activity-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Live Activity</h2>
                  <p>Recent platform events.</p>
                </div>

                <Activity size={17} />
              </div>

              <div className="admin-activity-list">
                {activities.map((activity, index) => {
                  const Icon = activity.icon;

                  return (
                    <div className="admin-activity-item" key={`${activity.name}-${index}`}>
                      <div className="activity-icon">
                        <Icon size={15} />
                      </div>

                      <div>
                        <strong>{activity.text}</strong>
                        <span>{activity.name}</span>
                        <small>{activity.time}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="admin-overview-grid">
            <div className="admin-overview-card">
              <div className="overview-card-icon">
                <Clock3 size={19} />
              </div>

              <div>
                <span>Pending Jobs</span>
                <strong>{dashboard.stats.jobs ? Math.max(0, Number(dashboard.stats.jobs) - Number(dashboard.stats.completed)) : 0}</strong>
                <small>Needs attention</small>
              </div>
            </div>

            <div className="admin-overview-card">
              <div className="overview-card-icon">
                <UserRoundCog size={19} />
              </div>

              <div>
                <span>Worker Verifications</span>
                <strong>0</strong>
                <small>Awaiting approval</small>
              </div>
            </div>

            <div className="admin-overview-card">
              <div className="overview-card-icon">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <span>Completed Today</span>
                <strong>{dashboard.stats.completed || 0}</strong>
                <small>Jobs completed</small>
              </div>
            </div>

            <div className="admin-overview-card">
              <div className="overview-card-icon">
                <IndianRupee size={19} />
              </div>

              <div>
                <span>Today's Revenue</span>
                <strong>₹{(Number(dashboard.stats.completed || 0) * 120).toLocaleString()}</strong>
                <small>Platform earnings</small>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;