const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_STORAGE_KEY = "nexserve_token";

const getToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

const request = async (endpoint, options = {}) => {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required. Please login again.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (data?.success === false) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeStatus = (value) => {
  const safeValue = String(value || "").trim().toLowerCase();

  if (["completed", "finished"].includes(safeValue)) return "Completed";
  if (["in_progress", "in-progress", "travelling", "traveling", "started", "inprogress", "active"].includes(safeValue)) return "In Progress";
  if (["cancelled", "canceled", "rejected"].includes(safeValue)) return "Cancelled";
  if (["pending", "posted", "searching", "new", "created"].includes(safeValue)) return "Pending";

  return safeValue ? safeValue.charAt(0).toUpperCase() + safeValue.slice(1) : "Pending";
};

export const adminService = {
  async fetchDashboard() {
    return request("/admin/dashboard");
  },

  async fetchUsers() {
    return request("/admin/users");
  },

  async fetchJobs() {
    return request("/admin/jobs");
  },

  async toggleUserBlock(id, role, blocked) {
    return request(`/admin/users/${id}/block`, {
      method: "PATCH",
      body: JSON.stringify({ role, blocked }),
    });
  },

  async fetchVerificationQueue() {
    return request("/verification/queue");
  },

  async updateVerification(id, status, notes = "") {
    return request(`/verification/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
  },

  formatDate,
  normalizeStatus,
};

export default adminService;
