import {
  Ban,
  CheckCircle2,
  Search,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import adminService from "../../services/adminService";

const Users = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminService.fetchUsers();

        if (!isMounted) return;

        const normalizedUsers = Array.isArray(response?.users)
          ? response.users.map((user) => ({
              id: user.id || user._id,
              name: user.name || "Unknown User",
              email: user.email || "-",
              phone: user.phone || "-",
              role: user.role === "Worker" ? "Worker" : "Customer",
              status: user.status === "Blocked" ? "Blocked" : "Active",
              joined: adminService.formatDate(user.joined || user.createdAt),
            }))
          : [];

        setUsers(normalizedUsers);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError?.message || "Unable to load users.");
        setUsers([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" || user.role === filter || user.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  const updateStatus = async (id, nextStatus) => {
    try {
      const target = users.find((user) => user.id === id);
      const role = target?.role || "Customer";

      await adminService.toggleUserBlock(id, role, nextStatus === "Blocked");

      setUsers((previous) =>
        previous.map((user) =>
          user.id === id ? { ...user, status: nextStatus } : user
        )
      );
    } catch (blockError) {
      setError(blockError?.message || "Unable to update status.");
    }
  };

  const activeUsers = users.filter((user) => user.status === "Active").length;
  const workers = users.filter((user) => user.role === "Worker").length;
  const customers = users.filter((user) => user.role === "Customer").length;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-area">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="dashboard-content">
          <section className="page-heading-row">
            <div>
              <span className="page-eyebrow">ADMIN PANEL</span>
              <h1>Users</h1>
              <p>Manage customers, workers and account access.</p>
            </div>
          </section>

          {error && <div className="form-error">{error}</div>}

          <section className="users-summary-grid">
            <div className="users-summary-card">
              <div className="users-summary-icon blue">
                <UserRound size={19} />
              </div>

              <div>
                <span>Total Users</span>
                <strong>{users.length}</strong>
              </div>
            </div>

            <div className="users-summary-card">
              <div className="users-summary-icon green">
                <UserRoundCheck size={19} />
              </div>

              <div>
                <span>Active Users</span>
                <strong>{activeUsers}</strong>
              </div>
            </div>

            <div className="users-summary-card">
              <div className="users-summary-icon orange">
                <ShieldCheck size={19} />
              </div>

              <div>
                <span>Workers</span>
                <strong>{workers}</strong>
              </div>
            </div>

            <div className="users-summary-card">
              <div className="users-summary-icon purple">
                <UserRound size={19} />
              </div>

              <div>
                <span>Customers</span>
                <strong>{customers}</strong>
              </div>
            </div>
          </section>

          <section className="users-panel">
            <div className="users-toolbar">
              <div className="user-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search by name, email, phone or ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="user-filters">
                {[
                  "All",
                  "Customer",
                  "Worker",
                  "Active",
                  "Blocked",
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

            <div className="users-table-wrapper">
              <div className="users-table-head">
                <span>USER</span>
                <span>CONTACT</span>
                <span>ROLE</span>
                <span>STATUS</span>
                <span>JOINED</span>
                <span>ACTION</span>
              </div>

              {loading ? (
                <div className="users-empty">
                  <Search size={24} />
                  <strong>Loading users...</strong>
                  <span>Please wait while data loads.</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="users-empty">
                  <Search size={24} />
                  <strong>No users found</strong>
                  <span>Try changing your search or filter.</span>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div className="users-table-row" key={user.id}>
                    <div className="user-info-cell">
                      <div className="user-avatar">{user.name.charAt(0)}</div>

                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.id}</span>
                      </div>
                    </div>

                    <div className="user-contact-cell">
                      <span>{user.email}</span>
                      <small>{user.phone}</small>
                    </div>

                    <span className={`user-role ${user.role.toLowerCase()}`}>{user.role}</span>

                    <span className={`user-status ${user.status.toLowerCase()}`}>
                      {user.status === "Active" && <CheckCircle2 size={11} />}
                      {user.status === "Blocked" && <Ban size={11} />}
                      {user.status}
                    </span>

                    <span className="user-joined">{user.joined}</span>

                    <div className="user-action-cell">
                      {user.status === "Blocked" ? (
                        <button
                          type="button"
                          className="user-action unblock"
                          onClick={() => updateStatus(user.id, "Active")}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="user-action block"
                          onClick={() => updateStatus(user.id, "Blocked")}
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="users-footer">
              <span>Showing {filteredUsers.length} of {users.length} users</span>
              <span>{loading ? "Loading backend data" : "Live backend data"}</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Users;