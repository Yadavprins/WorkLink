import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Save,
  Star,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SKILL_OPTIONS = [
  "Plumbing",
  "Pipe Repair",
  "Bathroom Repair",
  "Tap Installation",
  "Electrical",
  "Fan Installation",
  "Wiring",
  "AC Repair",
  "AC Service",
  "Carpentry",
  "Furniture Repair",
  "Wood Work",
  "Painting",
  "Wall Painting",
  "Interior",
  "Appliance Repair",
];

const CATEGORY_OPTIONS = [
  "Plumber",
  "Electrician",
  "AC Technician",
  "Carpenter",
  "Painter",
  "Appliance Technician",
];

const WorkerProfile = () => {
  const { user, updateUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [availabilityUpdating, setAvailabilityUpdating] =
    useState(false);

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const getToken = () => {
    return localStorage.getItem("nexserve_token");
  };

  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.message || "Something went wrong. Please try again."
      );
    }

    return data;
  };

  const normalizeProfile = (worker) => {
    if (!worker) return null;

    return {
      ...worker,

      id: worker._id || worker.id,

      name: worker.name || "",
      phone: worker.phone || "",

      city: worker.city || "",
      area: worker.area || "",

      skills: Array.isArray(worker.skills)
        ? worker.skills
        : [],

      experience: worker.experience ?? 0,

      rating: Number(worker.rating || 0),

      reviews: Number(
        worker.reviews ??
          worker.reviewCount ??
          worker.totalReviews ??
          0
      ),

      completedJobs: Number(worker.completedJobs || 0),

      acceptedJobs: Number(worker.acceptedJobs || 0),

      isAvailable: Boolean(worker.isAvailable),

      districtChangeUsed: Boolean(
        worker.districtChangeUsed
      ),

      location: worker.location || {
        latitude: null,
        longitude: null,
        updatedAt: null,
      },
    };
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/workers/profile");

      const current = normalizeProfile(data.worker);

      setProfile(current);
      setForm(current);
    } catch (err) {
      setError(
        err?.message || "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSaved(false);
    setError("");
  };

  const toggleSkill = (skill) => {
    setForm((previous) => {
      const skills = previous?.skills || [];

      return {
        ...previous,
        skills: skills.includes(skill)
          ? skills.filter((item) => item !== skill)
          : [...skills, skill],
      };
    });

    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      if (!form?.name?.trim()) {
        setError("Please enter your name.");
        return;
      }

      if (
        !Array.isArray(form.skills) ||
        form.skills.length === 0
      ) {
        setError("Please select at least one skill.");
        return;
      }

      const experience = Number(form.experience);

      if (
        !Number.isFinite(experience) ||
        experience < 0
      ) {
        setError(
          "Experience must be a valid number."
        );
        return;
      }

      const data = await apiRequest("/workers/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone?.trim() || "",
          skills: form.skills,
          experience,
        }),
      });

      const updated = normalizeProfile(data.worker);

      setProfile(updated);
      setForm(updated);
      setEditing(false);
      setSaved(true);

      if (updateUser) {
        updateUser({
          ...user,
          name: updated.name,
          phone: updated.phone,
          city: updated.city,
          area: updated.area,
          skills: updated.skills,
          isAvailable: updated.isAvailable,
        });
      }
    } catch (err) {
      setError(
        err?.message || "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile || availabilityUpdating) return;

    try {
      setAvailabilityUpdating(true);
      setError("");
      setSaved(false);

      const newAvailability =
        !profile.isAvailable;

      const data = await apiRequest(
        "/workers/availability",
        {
          method: "PATCH",
          body: JSON.stringify({
            isAvailable: newAvailability,
          }),
        }
      );

      const updated = normalizeProfile(
        data.worker
      );

      setProfile(updated);
      setForm(updated);

      if (updateUser) {
        updateUser({
          ...user,
          isAvailable:
            updated.isAvailable,
        });
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update availability."
      );
    } finally {
      setAvailabilityUpdating(false);
    }
  };

  const updateCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(
        "Location is not supported by this browser."
      );
      return;
    }

    setLocationUpdating(true);
    setError("");
    setSaved(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          const data = await apiRequest(
            "/workers/location",
            {
              method: "PATCH",
              body: JSON.stringify({
                latitude,
                longitude,
              }),
            }
          );

          const newLocation =
            data.location || {
              latitude,
              longitude,
              updatedAt: new Date().toISOString(),
            };

          setProfile((previous) => ({
            ...previous,
            location: newLocation,
          }));

          setForm((previous) => ({
            ...previous,
            location: newLocation,
          }));

          setSaved(true);
        } catch (err) {
          setError(
            err?.message ||
              "Unable to update current location."
          );
        } finally {
          setLocationUpdating(false);
        }
      },
      (geoError) => {
        let message =
          "Unable to get your location.";

        if (geoError.code === 1) {
          message =
            "Location permission denied. Please allow location access.";
        } else if (geoError.code === 2) {
          message =
            "Your current location could not be determined.";
        } else if (geoError.code === 3) {
          message =
            "Location request timed out. Please try again.";
        }

        setError(message);
        setLocationUpdating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const cancelEditing = () => {
    setForm(profile);
    setEditing(false);
    setError("");
    setSaved(false);
  };

  if (loading || !profile || !form) {
    return (
      <div className="app-layout">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="main-area">
          <Navbar
            onMenuClick={() =>
              setSidebarOpen(true)
            }
          />

          <main className="dashboard-content">
            <div className="jobs-page-empty">
              <div className="dashboard-loading-spinner" />

              <h3>
                Loading profile...
              </h3>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const hasCoordinates =
    Number.isFinite(
      Number(profile.location?.latitude)
    ) &&
    Number.isFinite(
      Number(profile.location?.longitude)
    );

  const cityChanged =
    String(form.city || "").trim().toLowerCase() !==
    String(profile.city || "").trim().toLowerCase();

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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
                PROFESSIONAL PROFILE
              </span>

              <h1>My Profile</h1>

              <p>
                Manage your professional
                information, skills and
                availability.
              </p>
            </div>

            <div className="worker-section-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={toggleAvailability}
                disabled={
                  availabilityUpdating
                }
              >
                <span />

                {availabilityUpdating
                  ? "Updating..."
                  : profile.isAvailable
                  ? "Online · Available"
                  : "Offline"}
              </button>

              {!editing && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setEditing(true);
                    setSaved(false);
                    setError("");
                  }}
                >
                  <Edit3 size={15} />
                  Edit Profile
                </button>
              )}
            </div>
          </section>

          {error && (
            <div className="my-jobs-error">
              <span>{error}</span>
            </div>
          )}

          {saved && (
            <div className="job-action-message success">
              <CheckCircle2 size={15} />
              Profile updated successfully.
            </div>
          )}

          <section className="worker-profile-layout">
            <div className="worker-profile-main">
              <div className="profile-top-card">
                <div className="profile-big-avatar">
                  {(profile.name || "W")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="profile-top-info">
                  <h2>{profile.name}</h2>

                  <span>
                    {profile.category ||
                      profile.skills?.[0] ||
                      "Professional Worker"}
                  </span>

                  <div className="profile-rating">
                    <Star
                      size={15}
                      fill="currentColor"
                    />

                    <strong>
                      {profile.rating.toFixed(
                        1
                      )}
                    </strong>

                    <span>
                      {profile.reviews} reviews
                    </span>
                  </div>
                </div>

                <div className="profile-verified">
                  <CheckCircle2 size={14} />
                  Verified Worker
                </div>
              </div>

              <div className="profile-form-card">
                <div className="profile-card-heading">
                  <div>
                    <h2>
                      Professional Information
                    </h2>

                    <p>
                      Information visible to
                      customers.
                    </p>
                  </div>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label>
                      Full Name
                    </label>

                    {editing ? (
                      <input
                        name="name"
                        value={
                          form.name || ""
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="profile-readonly">
                        <UserRound
                          size={15}
                        />

                        {profile.name ||
                          "Not provided"}
                      </div>
                    )}
                  </div>

                  <div className="profile-field">
                    <label>
                      Phone Number
                    </label>

                    {editing ? (
                      <input
                        name="phone"
                        value={
                          form.phone || ""
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="10-digit mobile number"
                        inputMode="numeric"
                        maxLength={10}
                      />
                    ) : (
                      <div className="profile-readonly">
                        <Phone size={15} />

                        {profile.phone ||
                          "Not provided"}
                      </div>
                    )}
                  </div>

                  <div className="profile-field">
                    <label>
                      Primary Category
                    </label>

                    {editing ? (
                      <select
                        name="category"
                        value={
                          form.category || ""
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="">
                          Select category
                        </option>

                        {CATEGORY_OPTIONS.map(
                          (item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          )
                        )}
                      </select>
                    ) : (
                      <div className="profile-readonly">
                        <BriefcaseBusiness
                          size={15}
                        />

                        {profile.category ||
                          profile.skills?.[0] ||
                          "Not specified"}
                      </div>
                    )}
                  </div>

                  <div className="profile-field">
                    <label>
                      Experience
                    </label>

                    {editing ? (
                      <input
                        name="experience"
                        type="number"
                        min="0"
                        step="1"
                        value={
                          form.experience ??
                          ""
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Years of experience"
                      />
                    ) : (
                      <div className="profile-readonly">
                        <Award size={15} />

                        {profile.experience ||
                          0}{" "}
                        years
                      </div>
                    )}
                  </div>

                  <div className="profile-field">
                    <label>
                      District / City
                    </label>

                    <div className="profile-readonly">
                      <MapPin size={15} />
                      {profile.city || "Not provided"}
                    </div>
                  </div>

                  <div className="profile-field">
                    <label>
                      Service Area
                    </label>

                    <div className="profile-readonly">
                      <MapPin size={15} />
                      {profile.area || "Not provided"}
                    </div>
                  </div>

                  <div className="profile-field full">
                    <a
                      className="secondary-btn full-width"
                      href="mailto:support@nexserve.local?subject=Worker%20address%20change%20request"
                    >
                      <Mail size={16} />
                      Request Address Change from Customer Care
                    </a>
                  </div>

                  <div className="profile-field full">
                    <label>
                      Current GPS Location
                    </label>

                    <div className="profile-location-box">
                      <div className="profile-readonly">
                        <Navigation size={15} />

                        {hasCoordinates
                          ? `${Number(
                              profile.location
                                .latitude
                            ).toFixed(
                              6
                            )}, ${Number(
                              profile.location
                                .longitude
                            ).toFixed(6)}`
                          : "Location not updated"}
                      </div>

                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={
                          updateCurrentLocation
                        }
                        disabled={
                          locationUpdating
                        }
                      >
                        <Navigation
                          size={15}
                        />

                        {locationUpdating
                          ? "Updating..."
                          : "Use Current Location"}
                      </button>
                    </div>

                    <small>
                      GPS location is used for
                      nearby-job matching within
                      the 5 km service radius.
                    </small>
                  </div>

                  <div className="profile-field full">
                    <label>
                      Skills
                    </label>

                    {!editing ? (
                      <div className="profile-skills-edit">
                        {(
                          profile.skills || []
                        ).length > 0 ? (
                          profile.skills.map(
                            (skill) => (
                              <button
                                key={skill}
                                type="button"
                                className="active"
                                disabled
                              >
                                {skill}
                              </button>
                            )
                          )
                        ) : (
                          <span>
                            No skills added
                            yet.
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="profile-skills-edit">
                        {SKILL_OPTIONS.map(
                          (skill) => (
                            <button
                              key={skill}
                              type="button"
                              className={
                                (
                                  form.skills ||
                                  []
                                ).includes(
                                  skill
                                )
                                  ? "active"
                                  : ""
                              }
                              onClick={() =>
                                toggleSkill(
                                  skill
                                )
                              }
                            >
                              {skill}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="profile-field full">
                    <label>
                      About You
                    </label>

                    <p className="profile-bio">
                      {profile.bio ||
                        "Professional worker available for local service jobs."}
                    </p>
                  </div>
                </div>

                {editing && (
                  <div className="profile-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={
                        cancelEditing
                      }
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="primary-btn"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Save size={15} />

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <aside className="profile-sidebar">
              <div className="profile-stat-card">
                <span>
                  COMPLETED JOBS
                </span>

                <strong>
                  {profile.completedJobs ||
                    0}
                </strong>

                <small>
                  Successfully completed
                </small>
              </div>

              <div className="profile-stat-card">
                <span>
                  AVERAGE RATING
                </span>

                <strong>
                  {profile.rating.toFixed(
                    1
                  )}
                </strong>

                <small>
                  From{" "}
                  {profile.reviews || 0}{" "}
                  customer reviews
                </small>
              </div>

              <div className="profile-stat-card">
                <span>
                  AVAILABILITY
                </span>

                <strong>
                  {profile.isAvailable
                    ? "Online"
                    : "Offline"}
                </strong>

                <small>
                  Toggle anytime from this
                  page
                </small>
              </div>

              <div className="profile-stat-card">
                <span>
                  GPS STATUS
                </span>

                <strong>
                  {hasCoordinates
                    ? "Updated"
                    : "Not Set"}
                </strong>

                <small>
                  Required to receive nearby
                  jobs
                </small>
              </div>

              <div className="profile-skills-card">
                <h3>My Skills</h3>

                <div>
                  {(profile.skills || [])
                    .length > 0 ? (
                    profile.skills.map(
                      (skill) => (
                        <span key={skill}>
                          {skill}
                        </span>
                      )
                    )
                  ) : (
                    <span>
                      No skills added
                    </span>
                  )}
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
};

export default WorkerProfile;