const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const TOKEN_STORAGE_KEY =
  "nexserve_token";

const getToken = () => {
  return localStorage.getItem(
    TOKEN_STORAGE_KEY
  );
};

const request = async (
  endpoint,
  options = {}
) => {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Authentication required. Please login again."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
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

    error.status =
      response.status;

    throw error;
  }

  if (data?.success === false) {
    throw new Error(
      data?.message ||
        "Request failed."
    );
  }

  return data;
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

  let location = "";

  if (
    typeof job.location ===
    "string"
  ) {
    location = job.location;
  } else if (
    job.location &&
    typeof job.location ===
      "object"
  ) {
    location =
      job.location.address ||
      job.location.area ||
      job.location.city ||
      "";
  }

  if (!location) {
    location = [
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

    location:
      location ||
      "Location not specified",

    budget: {
      min,
      max,
    },

    assignedWorker:
      job.assignedWorker ||
      null,

    worker:
      job.assignedWorker ||
      job.worker ||
      null,
  };
};

const workerJobService = {
  // ===================================================
  // AVAILABLE JOBS
  // ===================================================

  async getAvailableJobs({
    category = "",
    skill = "",
    limit = 50,
  } = {}) {
    const params =
      new URLSearchParams();

    params.set(
      "status",
      "posted"
    );

    params.set(
      "limit",
      String(limit)
    );

    if (
      category &&
      category !== "All"
    ) {
      params.set(
        "category",
        category
      );
    }

    if (skill) {
      params.set(
        "skill",
        skill
      );
    }

    const data =
      await request(
        `/workers/jobs/search?${params.toString()}`
      );

    const jobs = Array.isArray(
      data?.jobs
    )
      ? data.jobs
      : [];

    return jobs.map(normalizeJob);
  },

  // ===================================================
  // WORKER JOB DETAILS
  // ===================================================

  async getJobById(id) {
    if (!id) {
      throw new Error(
        "Job ID is required."
      );
    }

    const data =
      await request(
        `/jobs/worker/${id}`
      );

    return normalizeJob(
      data?.job
    );
  },

  // ===================================================
  // ACCEPT JOB
  // ===================================================

  async acceptJob(id) {
    if (!id) {
      throw new Error(
        "Job ID is required."
      );
    }

    const data =
      await request(
        `/jobs/${id}/accept`,
        {
          method: "PATCH",
        }
      );

    return {
      ...(normalizeJob(
        data?.job ||
          data?.data
      ) || {}),
      id,
      _id: id,
      status: data?.status || "in_progress",
    };
  },

  async rejectJob(id) {
    if (!id) {
      throw new Error("Job ID is required.");
    }

    return request(
      `/jobs/${id}/reject`,
      { method: "PATCH" }
    );
  },

  // ===================================================
  // WORKER MY JOBS
  // ===================================================

  async getMyJobs() {
    const data =
      await request(
        "/jobs/worker/my-jobs"
      );

    const jobs = Array.isArray(
      data?.jobs
    )
      ? data.jobs
      : [];

    return jobs.map(normalizeJob);
  },

  // ===================================================
  // START TRAVEL
  // ===================================================

  async startTravel(id) {
    const data =
      await request(
        `/jobs/${id}/on-the-way`,
        {
          method: "PATCH",
        }
      );

    return normalizeJob(
      data?.job ||
        data?.data
    );
  },

  async markArrived(id) {
    if (!id) {
      throw new Error("Job ID is required.");
    }

    const data = await request(
      `/jobs/${id}/arrived`,
      { method: "PATCH" }
    );

    return normalizeJob(data?.job || data?.data);
  },

  async updateLocation(latitude, longitude) {
    const data = await request(
      "/workers/location",
      {
        method: "PATCH",
        body: JSON.stringify({ latitude, longitude }),
      }
    );

    return data?.location || null;
  },

  // ===================================================
  // VERIFY OTP
  // ===================================================

  async verifyJobOTP(
    id,
    otp
  ) {
    const data =
      await request(
        `/jobs/${id}/verify-otp`,
        {
          method: "PATCH",
          body: JSON.stringify({
            otp,
          }),
        }
      );

    return {
      ...(normalizeJob(
        data?.job ||
          data?.data
      ) || {}),
      id,
      _id: id,
      status: data?.status || "in_progress",
    };
  },
};

export default workerJobService;