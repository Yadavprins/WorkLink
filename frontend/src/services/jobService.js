const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const TOKEN_STORAGE_KEY = "nexserve_token";

const getToken = () => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

const request = async (endpoint, options = {}) => {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required. Please login again.");
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        `Request failed with status ${response.status}`
    );

    error.status = response.status;

    throw error;
  }

  if (data?.success === false) {
    throw new Error(
      data?.message || "Request failed."
    );
  }

  return data;
};

// -----------------------------------------------------
// CATEGORY -> BACKEND WORKER SKILL
// -----------------------------------------------------
// Worker backend exact skill match karta hai.
// Isliye Plumbing -> Plumber etc.
// -----------------------------------------------------

const getRequiredSkill = (category, existingSkill) => {
  if (existingSkill?.trim()) {
    return existingSkill.trim();
  }

  const value = String(category || "")
    .trim()
    .toLowerCase();

  const skillMap = {
    plumbing: "Plumber",
    electrical: "Electrician",
    "ac & appliance": "AC Technician",
    carpentry: "Carpenter",
    painting: "Painter",
    cleaning: "Cleaner",
    "vehicle repair": "Mechanic",
    appliance: "Appliance Technician",
    "appliance repair": "Appliance Technician",
    "ac repair": "AC Technician",
  };

  return skillMap[value] || category || "General Worker";
};

const normalizeJob = (job) => {
  if (!job) return null;

  const id =
    job._id ||
    job.id ||
    "";

  const min =
    Number(
      job.budget?.min ??
        job.estimatedMinPrice ??
        0
    );

  const max =
    Number(
      job.budget?.max ??
        job.estimatedMaxPrice ??
        0
    );

  const worker =
    job.assignedWorker ||
    job.worker ||
    null;

  let locationText = "";

  if (typeof job.location === "string") {
    locationText = job.location;
  } else if (
    job.location &&
    typeof job.location === "object"
  ) {
    locationText =
      job.location.address ||
      job.location.area ||
      job.location.city ||
      "";
  }

  if (!locationText) {
    locationText = [
      job.address,
      job.area,
      job.city,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return {
    ...job,

    id,
    _id: id,

    title: job.title || "Untitled Job",

    category:
      job.category || "Service",

    description:
      job.description || "",

    status:
      job.status || "posted",

    location:
      locationText || "Location not specified",

    locationText:
      locationText || "Location not specified",

    budget: {
      min,
      max,
    },

    estimatedMinPrice:
      Number(
        job.estimatedMinPrice ?? min
      ),

    estimatedMaxPrice:
      Number(
        job.estimatedMaxPrice ?? max
      ),

    assignedWorker: worker,
    worker,

    requiredSkill:
      job.requiredSkill ||
      getRequiredSkill(job.category, ""),
  };
};

const formatTransactionDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString();
};

const normalizeTransaction = (job, type) => {
  const isEarning = type === "Earning";
  const amount = Number(
    job.finalPrice ||
      job.workerQuote ||
      job.estimatedMaxPrice ||
      job.estimatedMinPrice ||
      0
  );

  return {
    id:
      job.transactionId ||
      `JOB-${job._id || job.id}`,
    job: job.title || "Untitled Job",
    type,
    amount,
    method: job.paymentMethod || (isEarning ? "-" : "mock"),
    status:
      job.paymentStatus === "paid"
        ? "Completed"
        : "Pending",
    date: formatTransactionDate(
      job.paidAt || job.updatedAt || job.createdAt
    ),
  };
};

const jobService = {
  // ===================================================
  // CUSTOMER - MY JOBS
  // ===================================================

  async getMyJobs() {
    const data = await request(
      "/jobs/my-jobs"
    );

    const jobs = Array.isArray(data?.jobs)
      ? data.jobs
      : [];

    return jobs.map(normalizeJob);
  },

  // ===================================================
  // PAYMENTS AND EARNINGS
  // ===================================================

  async getTransactions() {
    const user = JSON.parse(
      localStorage.getItem("nexserve_user") || "null"
    );

    if (user?.role === "worker") {
      const data = await request(
        "/workers/earnings"
      );

      const jobs = Array.isArray(data?.earnings?.jobs)
        ? data.earnings.jobs
        : [];

      return jobs.map((job) =>
        normalizeTransaction(job, "Earning")
      );
    }

    const data = await request(
      "/jobs/my-jobs"
    );

    const jobs = Array.isArray(data?.jobs)
      ? data.jobs
      : [];

    return jobs
      .filter((job) =>
        ["pending", "paid"].includes(
          job.paymentStatus
        )
      )
      .map((job) =>
        normalizeTransaction(job, "Payment")
      );
  },

  // ===================================================
  // CUSTOMER - SINGLE JOB
  // ===================================================

  async getJobById(id) {
    if (!id) {
      throw new Error("Job ID is required.");
    }

    const data = await request(
      `/jobs/${id}`
    );

    return normalizeJob(
      data?.job
    );
  },

  // ===================================================
  // CUSTOMER - CREATE JOB
  // ===================================================

  async createJob(job) {
    if (!job) {
      throw new Error("Job data is required.");
    }

    const payload = {
      ...job,

      title:
        String(job.title || "").trim(),

      category:
        String(job.category || "").trim(),

      description:
        String(job.description || "").trim(),

      location:
        String(job.location || "").trim(),

      city:
        String(job.city || "").trim(),

      area:
        String(job.area || "").trim(),

      latitude:
        Number(job.latitude),

      longitude:
        Number(job.longitude),

      minBudget:
        Number(job.minBudget),

      maxBudget:
        Number(job.maxBudget),

      requiredSkill:
        getRequiredSkill(
          job.category,
          job.requiredSkill
        ),

      bookingType:
        job.bookingType || "instant",

      urgency:
        job.urgency || "normal",

      image:
        job.image || "",
    };

    const data = await request(
      "/jobs",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    return normalizeJob(
      data?.job ||
        data?.data ||
        data
    );
  },

  // ===================================================
  // CUSTOMER - CANCEL JOB
  // ===================================================

  async cancelJob(id) {
    if (!id) {
      throw new Error("Job ID is required.");
    }

    const data = await request(
      `/jobs/${id}/cancel`,
      {
        method: "PATCH",
      }
    );

    return normalizeJob(
      data?.job ||
        data?.data
    );
  },

  async deleteJob(id) {
    if (!id) {
      throw new Error("Job ID is required.");
    }

    return request(
      `/jobs/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};

export default jobService;