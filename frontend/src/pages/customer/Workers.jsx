import {
  BriefcaseBusiness,
  CheckCircle2,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  Star,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const TOKEN_STORAGE_KEY =
  "nexserve_token";

const Workers = () => {
  const [searchParams] =
    useSearchParams();

  const jobId =
    searchParams.get(
      "jobId"
    );

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [workers, setWorkers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [favoriteIds, setFavoriteIds] = useState([]);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const getToken = () => {
    return localStorage.getItem(
      TOKEN_STORAGE_KEY
    );
  };

  const loadWorkers =
    async (
      isRefresh = false
    ) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token =
          getToken();

        if (!token) {
          throw new Error(
            "Authentication required. Please login again."
          );
        }

        const params =
          new URLSearchParams();

        if (
          category !== "All"
        ) {
          params.set(
            "skill",
            category
          );
        }

        const response =
          await fetch(
            `${API_BASE_URL}/customers/workers?${params.toString()}`,
            {
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load workers."
          );
        }

        setWorkers(
          Array.isArray(
            data?.workers
          )
            ? data.workers
            : []
        );
      } catch (err) {
        console.error(
          "Customer workers error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load workers."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    loadWorkers();
  }, [category]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/customer-features/favorites`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((response) => response.json())
      .then((data) => setFavoriteIds((data.workers || []).map((worker) => String(worker._id))))
      .catch(() => {});
  }, []);

  const toggleFavorite = async (workerId) => {
    const response = await fetch(`${API_BASE_URL}/customer-features/favorites/${workerId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await response.json();
    if (response.ok) setFavoriteIds((data.workers || []).map((worker) => String(worker._id)));
  };

  const categories =
    useMemo(() => {
      return [
        "All",
        "Plumber",
        "Electrician",
        "AC Technician",
        "Carpenter",
        "Painter",
        "Cleaner",
        "Mechanic",
        "Appliance Technician",
      ];
    }, []);

  const filteredWorkers =
    useMemo(() => {
      const text =
        search
          .toLowerCase()
          .trim();

      if (!text) {
        return workers;
      }

      return workers.filter(
        (worker) => {
          const skills =
            Array.isArray(
              worker.skills
            )
              ? worker.skills.join(
                  " "
                )
              : "";

          return (
            worker.name
              ?.toLowerCase()
              .includes(text) ||
            skills
              .toLowerCase()
              .includes(text) ||
            worker.city
              ?.toLowerCase()
              .includes(text) ||
            worker.area
              ?.toLowerCase()
              .includes(text)
          );
        }
      );
    }, [workers, search]);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="main-area">
        <Navbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="dashboard-content">
          <section className="page-heading-row">
            <div>
              <span className="page-eyebrow">
                LOCAL PROFESSIONALS
              </span>

              <h1>
                Find Workers
              </h1>

              <p>
                Available skilled
                professionals on NexServe.
              </p>

              {jobId && (
                <p>
                  Showing workers for
                  your selected job.
                </p>
              )}
            </div>
          </section>

          {error && (
            <div className="dashboard-error">
              <span>{error}</span>

              <button
                type="button"
                onClick={() =>
                  loadWorkers(true)
                }
              >
                Retry
              </button>
            </div>
          )}

          <section className="workers-toolbar">
            <div className="workers-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search by name or skill..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="worker-select">
              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item === "All"
                        ? "All Services"
                        : item}
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                loadWorkers(true)
              }
              disabled={
                refreshing
              }
            >
              <RefreshCw
                size={16}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </section>

          {loading ? (
            <div className="jobs-page-empty">
              <div className="dashboard-loading-spinner" />

              <h3>
                Finding workers...
              </h3>

              <p>
                Loading available
                professionals.
              </p>
            </div>
          ) : filteredWorkers.length ===
            0 ? (
            <div className="jobs-page-empty">
              <div className="empty-job-icon">
                <Search size={26} />
              </div>

              <h3>
                No available workers
              </h3>

              <p>
                Try another skill or
                check again later.
              </p>
            </div>
          ) : (
            <section className="workers-grid">
              {filteredWorkers.map(
                (worker) => (
                  <article
                    className="worker-card"
                    key={
                      worker._id ||
                      worker.id
                    }
                  >
                    <div className="worker-card-header">
                      <div className="worker-large-avatar">
                        {worker.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "W"}
                      </div>

                      <div className="worker-card-heading">
                        <div className="worker-name-row">
                          <h2>
                            {worker.name}
                          </h2>

                          {worker.isAvailable && (
                            <span className="available-dot">
                              Available
                            </span>
                          )}
                        </div>

                        <span>
                          {Array.isArray(
                            worker.skills
                          )
                            ? worker.skills.join(
                                " · "
                              )
                            : "Professional"}
                        </span>
                      </div>

                      <button type="button" className={favoriteIds.includes(String(worker._id)) ? "favorite-worker active" : "favorite-worker"} onClick={() => toggleFavorite(worker._id)} aria-label="Toggle favorite worker" title="Favorite worker">
                        <Heart size={18} fill={favoriteIds.includes(String(worker._id)) ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <div className="worker-rating">
                      <Star
                        size={15}
                        fill="currentColor"
                      />

                      <strong>
                        {worker.rating ??
                          "N/A"}
                      </strong>

                      <span>
                        Rating
                      </span>
                    </div>

                    <div className="worker-location">
                      <MapPin
                        size={15}
                      />

                      <span>
                        {[
                          worker.area,
                          worker.city,
                        ]
                          .filter(Boolean)
                          .join(
                            ", "
                          ) ||
                          "Location unavailable"}
                      </span>
                    </div>

                    <div className="worker-experience">
                      <BriefcaseBusiness
                        size={15}
                      />

                      <span>
                        {worker.experience ??
                          0}{" "}
                        years experience
                      </span>

                      <span>
                        {worker.completedJobs ??
                          0}{" "}
                        jobs completed
                      </span>
                    </div>

                    <div className="worker-skills">
                      {Array.isArray(
                        worker.skills
                      ) &&
                        worker.skills
                          .slice(
                            0,
                            3
                          )
                          .map(
                            (
                              skill
                            ) => (
                              <span
                                key={
                                  skill
                                }
                              >
                                {
                                  skill
                                }
                              </span>
                            )
                          )}
                    </div>

                    <div className="worker-card-footer">
                      <div className="worker-rate">
                        <span>
                          Status
                        </span>

                        <strong>
                          Available
                        </strong>
                      </div>

                      {worker.phone ? (
                        <a
                          href={`tel:${worker.phone}`}
                          className="view-worker-btn"
                        >
                          <UserRound
                            size={
                              15
                            }
                          />
                          Contact
                        </a>
                      ) : (
                        <span className="view-worker-btn">
                          <CheckCircle2
                            size={
                              15
                            }
                          />
                          Verified
                        </span>
                      )}
                    </div>
                  </article>
                )
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Workers;