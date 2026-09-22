import {
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import Settings from "../pages/Settings";
import Notifications from "../pages/Notifications";
import Transactions from "../pages/Transactions";
import LandingPage from "../pages/auth/LandingPage";
import RoleSelection from "../pages/auth/RoleSelection";

// Customer
import CustomerDashboard from "../pages/customer/CustomerDashboard";
import CreateJob from "../pages/customer/CreateJob";
import MyJobs from "../pages/customer/MyJobs";
import JobDetails from "../pages/customer/JobDetails";
import Workers from "../pages/customer/Workers";
import ServiceMap from "../pages/customer/ServiceMap";

// Worker
import WorkerDashboard from "../pages/worker/WorkerDashboard";
import AvailableJobs from "../pages/worker/AvailableJobs";
import WorkerMyJobs from "../pages/worker/WorkerMyJobs";
import WorkerJobDetails from "../pages/worker/WorkerJobDetails";
import WorkerProfile from "../pages/worker/WorkerProfile";
import WorkerEarnings from "../pages/worker/WorkerEarnings";

// Admin
import AdminDashboard from "../pages/admin/AdminDashboard";
import Users from "../pages/admin/Users";
import Jobs from "../pages/admin/Jobs";
import Reports from "../pages/admin/Reports";
import WorkerVerification from "../pages/admin/WorkerVerification";


const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, token } = useAuth();
    const location = useLocation();

    if (!token) {
        return (
            <Navigate
                to={`/login?role=${requiredRole || "customer"}`}
                replace
                state={{ from: location }}
            />
        );
    }

    if (requiredRole && user && user.role && user.role !== requiredRole) {
        return (
            <Navigate
                to={`/${user.role === "worker" ? "worker" : "customer"}/dashboard`}
                replace
            />
        );
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>

            {/* =========================
                PUBLIC
            ========================= */}

            <Route
                path="/login"
                element={<LoginPage />}
            />

            <Route
                path="/register"
                element={<RegisterPage />}
            />

            <Route
                path="/role-selection"
                element={<RoleSelection />}
            />


            {/* =========================
                CUSTOMER
            ========================= */}

            <Route
                path="/customer/dashboard"
                element={
                    <ProtectedRoute requiredRole="customer">
                        <CustomerDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/customer/service-map"
                element={
                    <ProtectedRoute requiredRole="customer">
                        <ServiceMap />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/customer/create-job"
                element={
                    <ProtectedRoute requiredRole="customer">
                        <CreateJob />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/customer/my-jobs"
                element={
                    <ProtectedRoute requiredRole="customer">
                        <MyJobs />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/customer/jobs/:id"
                element={
                    <ProtectedRoute requiredRole="customer">
                        <JobDetails />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/workers"
                element={
                    <ProtectedRoute requiredRole="customer">
                        <Workers />
                    </ProtectedRoute>
                }
            />


            {/* =========================
                WORKER
            ========================= */}

            <Route
                path="/worker/dashboard"
                element={
                    <ProtectedRoute requiredRole="worker">
                        <WorkerDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/worker/available-jobs"
                element={
                    <ProtectedRoute requiredRole="worker">
                        <AvailableJobs />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/worker/my-jobs"
                element={
                    <ProtectedRoute requiredRole="worker">
                        <WorkerMyJobs />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/worker/jobs/:id"
                element={
                    <ProtectedRoute requiredRole="worker">
                        <WorkerJobDetails />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/worker/profile"
                element={
                    <ProtectedRoute requiredRole="worker">
                        <WorkerProfile />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/worker/earnings"
                element={
                    <ProtectedRoute requiredRole="worker">
                        <WorkerEarnings />
                    </ProtectedRoute>
                }
            />


            {/* =========================
                ADMIN
            ========================= */}

            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/users"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <Users />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/jobs"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <Jobs />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/worker-verification"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <WorkerVerification />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/reports"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <Reports />
                    </ProtectedRoute>
                }
            />


            {/* =========================
                COMMON PAGES
            ========================= */}

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/notifications"
                element={
                    <ProtectedRoute>
                        <Notifications />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/transactions"
                element={
                    <ProtectedRoute>
                        <Transactions />
                    </ProtectedRoute>
                }
            />


            {/* =========================
                DEFAULT
            ========================= */}

            <Route
                path="/"
                element={
                    <LandingPage />
                }
            />

            <Route
                path="*"
                element={
                    <Navigate
                        to="/login?role=customer"
                        replace
                    />
                }
            />

        </Routes>
    );
}

export default AppRoutes;