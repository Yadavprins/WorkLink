import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  Home,
  LogOut,
  PlusCircle,
  Settings,
  Map,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const customerMenu = [
    { label: "Dashboard", path: "/customer/dashboard", icon: Home },
    { label: "Service Map", path: "/customer/service-map", icon: Map },
    { label: "Post a Job", path: "/customer/create-job", icon: PlusCircle },
    { label: "My Jobs", path: "/customer/my-jobs", icon: ClipboardList },
    { label: "Find Workers", path: "/workers", icon: Users },
    { label: "Transactions", path: "/transactions", icon: Wallet },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const workerMenu = [
    { label: "Dashboard", path: "/worker/dashboard", icon: Home },
    { label: "Available Jobs", path: "/worker/available-jobs", icon: BriefcaseBusiness },
    { label: "My Jobs", path: "/worker/my-jobs", icon: ClipboardList },
    { label: "Earnings", path: "/worker/earnings", icon: Wallet },
    { label: "Profile", path: "/worker/profile", icon: User },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const adminMenu = [
    { label: "Dashboard", path: "/admin/dashboard", icon: Home },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Worker Verification", path: "/admin/worker-verification", icon: FileCheck2 },
    { label: "Jobs", path: "/admin/jobs", icon: BriefcaseBusiness },
    { label: "Reports", path: "/admin/reports", icon: BarChart3 },
    { label: "Transactions", path: "/transactions", icon: Wallet },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const menu =
    user?.role === "worker"
      ? workerMenu
      : user?.role === "admin"
        ? adminMenu
        : customerMenu;

  const roleLabel =
    user?.role === "worker"
      ? "Worker Account"
      : user?.role === "admin"
        ? "Admin Account"
        : "Customer Account";

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate("/login?role=customer", { replace: true });
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">N</div>
            <div>
              <h2>NexServe</h2>
              <span>Local Services</span>
            </div>
          </div>

          <button className="sidebar-close" onClick={onClose} type="button" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-role">
          <span>ACCOUNT</span>
          <strong>{roleLabel}</strong>
        </div>

        <nav className="sidebar-nav">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout} type="button">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
