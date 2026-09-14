import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const params = new URLSearchParams(location.search);
  const initialRole = params.get("role") || "customer";

  const [role, setRole] = useState(
    ["customer", "worker", "admin"].includes(initialRole)
      ? initialRole
      : "customer"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleNames = {
    customer: "Customer",
    worker: "Worker",
    admin: "Admin",
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError("");

    navigate(`/login?role=${selectedRole}`, {
      replace: true,
    });
  };

  const redirectAfterLogin = (loggedUser) => {
    const loggedRole = loggedUser?.role || role;

    if (loggedRole === "customer") {
      navigate("/customer/dashboard");
    } else if (loggedRole === "worker") {
      navigate("/worker/dashboard");
    } else if (loggedRole === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 4) {
      setError("Password must contain at least 4 characters.");
      return;
    }

    try {
      setLoading(true);

      const loggedUser = await login({
        email: email.trim(),
        password,
        role,
      });

      redirectAfterLogin(loggedUser);
    } catch (err) {
      setError(
        err?.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");

    setError(
      "Demo login is disabled because authentication is now connected to the backend. Please use a registered account."
    );
  };

  return (
    <main className="auth-page">
      <div className="login-wrapper">
        <button
          className="back-button"
          type="button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <section className="login-card">
          <div className="login-header">
            <div className="brand-logo large">N</div>

            <h1>Login to NexServe</h1>

            <p>
              Sign in to continue as{" "}
              <strong>{roleNames[role]}</strong>.
            </p>
          </div>

          <div className="role-switcher">
            {Object.entries(roleNames).map(([key, value]) => (
              <button
                key={key}
                type="button"
                className={
                  role === key
                    ? "role-option active"
                    : "role-option"
                }
                onClick={() => handleRoleChange(key)}
              >
                {value}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Email
              <div className="input-wrapper">
                <Mail size={18} />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </label>

            <label>
              Password
              <div className="input-wrapper">
                <LockKeyhole size={18} />

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </label>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              className="primary-button full"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            className="demo-button"
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
          >
            Continue with Demo Account
          </button>

          <p className="demo-note">
            Use your registered NexServe account to sign in.
          </p>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;