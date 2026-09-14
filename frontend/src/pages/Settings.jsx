import {
  ArrowLeft,
  CheckCircle2,
  Crosshair,
  MapPin,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const TOKEN_STORAGE_KEY =
  "nexserve_token";

const Settings = () => {
  const {
    user,
    updateUser,
    logout,
  } = useAuth();

  const role =
    user?.role === "worker"
      ? "worker"
      : "customer";

  const dashboardPath =
    role === "worker"
      ? "/worker/dashboard"
      : "/customer/dashboard";

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    area: "",
  });

  const [location, setLocation] =
    useState({
      latitude: null,
      longitude: null,
    });

  const [saving, setSaving] =
    useState(false);

  const [locationSaving, setLocationSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!user) return;

    setProfile({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      city: user.city || "",
      area: user.area || "",
    });

    if (user.location) {
      setLocation({
        latitude:
          user.location.latitude ??
          null,
        longitude:
          user.location.longitude ??
          null,
      });
    }
  }, [user]);

  const getToken = () => {
    return localStorage.getItem(
      TOKEN_STORAGE_KEY
    );
  };

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type":
        "application/json",
      ...(token
        ? {
            Authorization:
              `Bearer ${token}`,
          }
        : {}),
    };
  };

  const handleProfileChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const endpoint =
        role === "worker"
          ? `${API_BASE_URL}/workers/profile`
          : `${API_BASE_URL}/users/profile`;

      const response =
        await fetch(endpoint, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            name: profile.name.trim(),
            phone: profile.phone.trim(),
            ...(role === "customer"
              ? {
                  city: profile.city.trim(),
                  area: profile.area.trim(),
                }
              : {}),
          }),
        });

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data?.message ||
            "Profile update failed."
        );
      }

      const updatedUser =
        data.user ||
        data.worker ||
        data.data;

      updateUser({
        ...(updatedUser || {}),
        name:
          updatedUser?.name ??
          profile.name.trim(),
        phone:
          updatedUser?.phone ??
          profile.phone.trim(),
        city:
          updatedUser?.city ??
          profile.city.trim(),
        area:
          updatedUser?.area ??
          profile.area.trim(),
        role:
          updatedUser?.role ||
          role,
      });

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile save error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveLocation = async (
    latitude,
    longitude
  ) => {
    const endpoint =
      role === "worker"
        ? `${API_BASE_URL}/workers/location`
        : `${API_BASE_URL}/users/location`;

    const response =
      await fetch(endpoint, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          latitude:
            Number(latitude),
          longitude:
            Number(longitude),
        }),
      });

    const data =
      await response
        .json()
        .catch(() => ({}));

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data?.message ||
          "Location update failed."
      );
    }

    const savedLocation =
      data.location ||
      data.user?.location ||
      data.worker?.location;

    const finalLocation = {
      latitude:
        savedLocation?.latitude ??
        Number(latitude),

      longitude:
        savedLocation?.longitude ??
        Number(longitude),
    };

    setLocation(finalLocation);

    updateUser({
      location: finalLocation,
    });

    return finalLocation;
  };

  const reverseGeocode = async (
    latitude,
    longitude
  ) => {
    try {
      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
            latitude
          )}&lon=${encodeURIComponent(
            longitude
          )}&zoom=18&addressdetails=1`,
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      if (!response.ok) {
        return null;
      }

      const data =
        await response.json();

      const address =
        data?.address || {};

      const city =
        address.city ||
        address.town ||
        address.municipality ||
        address.county ||
        "";

      const area =
        address.suburb ||
        address.neighbourhood ||
        address.village ||
        "";

      return {
        city,
        area,
      };
    } catch (err) {
      console.warn(
        "Reverse geocoding failed:",
        err
      );

      return null;
    }
  };

  const updateCurrentLocation =
    useCallback(() => {
      setLocationSaving(true);
      setMessage("");
      setError("");

      if (!navigator.geolocation) {
        setError(
          "Geolocation is not supported by this browser."
        );

        setLocationSaving(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            await saveLocation(
              latitude,
              longitude
            );

            const locationData =
              await reverseGeocode(
                latitude,
                longitude
              );

            if (locationData) {
              const nextProfile = {
                ...profile,
                city:
                  locationData.city ||
                  profile.city,
                area:
                  locationData.area ||
                  profile.area,
              };

              setProfile(
                nextProfile
              );

              updateUser({
                city:
                  nextProfile.city,
                area:
                  nextProfile.area,
              });
            }

            setMessage(
              "Current location saved successfully."
            );
          } catch (err) {
            console.error(
              "GPS save error:",
              err
            );

            setError(
              err?.message ||
                "Unable to save current location."
            );
          } finally {
            setLocationSaving(false);
          }
        },
        (geoError) => {
          console.error(
            "Geolocation error:",
            geoError
          );

          let errorMessage =
            "Unable to get your location.";

          if (geoError.code === 1) {
            errorMessage =
              "Location permission denied. Please allow location access.";
          } else if (
            geoError.code === 2
          ) {
            errorMessage =
              "Location is currently unavailable.";
          } else if (
            geoError.code === 3
          ) {
            errorMessage =
              "Location request timed out. Please try again.";
          }

          setError(errorMessage);
          setLocationSaving(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    }, [profile, updateUser]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={pageWrap}>
      <div style={topBar}>
        <Link to={dashboardPath} className="back-btn">
          <ArrowLeft size={18} />
          Back
        </Link>

        <div>
          <p style={eyebrow}>Account</p>
          <h1 style={heading}>Settings</h1>
        </div>
      </div>

      {message && (
        <div style={successMessage}>
          <CheckCircle2 size={16} style={iconInline} />
          {message}
        </div>
      )}

      {error && <div style={errorMessage}>{error}</div>}

      <div style={gridLayout}>
        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionHeadingWrap}>
              <UserRound size={19} style={iconInline} />
              <div>
                <h2 style={cardTitle}>Profile</h2>
                <p style={mutedText}>Update your personal information.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={fieldGrid}>
              <Field label="Name" name="name" value={profile.name} onChange={handleProfileChange} required />
              <Field label="Email" name="email" value={profile.email} disabled />
              <Field label="Phone" name="phone" value={profile.phone} onChange={handleProfileChange} required />
              <Field
                label="City"
                name="city"
                value={profile.city}
                onChange={role === "customer" ? handleProfileChange : undefined}
                disabled={role === "worker"}
                required
              />
              <Field
                label="Area"
                name="area"
                value={profile.area}
                onChange={role === "customer" ? handleProfileChange : undefined}
                disabled={role === "worker"}
                required
              />
            </div>

            {role === "worker" && (
              <p style={helperNote}>
                Worker address is permanent. Request changes from <a href="mailto:support@nexserve.local">Customer Care</a>.
              </p>
            )}

            <button type="submit" disabled={saving} style={primaryButton}>
              <Save size={16} style={iconInline} />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionHeadingWrap}>
              <ShieldCheck size={19} style={iconInline} />
              <div>
                <h2 style={cardTitle}>Account</h2>
                <p style={mutedText}>Security and session.</p>
              </div>
            </div>
          </div>

          <div style={accountSummary}>
            <div>
              <span style={labelText}>Logged in as</span>
              <strong style={strongText}>{role}</strong>
            </div>
            <div style={accountBadge}>{user?.name || "NexServe User"}</div>
          </div>

          <button type="button" onClick={handleLogout} style={dangerButton}>
            Logout
          </button>
        </section>
      </div>

      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionHeadingWrap}>
            <MapPin size={19} style={iconInline} />
            <div>
              <h2 style={cardTitle}>Location</h2>
              <p style={mutedText}>Your GPS location helps match nearby jobs.</p>
            </div>
          </div>
        </div>

        <div style={locationGrid}>
          <div style={locationBoxStyle}>
            <strong>Latitude</strong>
            <div style={locationValue}>{location.latitude !== null ? location.latitude : "Not set"}</div>
          </div>

          <div style={locationBoxStyle}>
            <strong>Longitude</strong>
            <div style={locationValue}>{location.longitude !== null ? location.longitude : "Not set"}</div>
          </div>
        </div>

        <button type="button" onClick={updateCurrentLocation} disabled={locationSaving} style={primaryButton}>
          <Crosshair size={17} style={iconInline} />
          {locationSaving ? "Getting Location..." : "Use Current Location"}
        </button>
      </section>
    </div>
  );
};

const Field = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  required = false,
}) => {
  return (
    <div>
      <label>
        {label}
      </label>

      <input
        type={
          name === "email"
            ? "email"
            : "text"
        }
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={{
          ...inputStyle,
          ...(disabled
            ? {
                background:
                  "#f5f5f5",
                cursor:
                  "not-allowed",
              }
            : {}),
        }}
      />
    </div>
  );
};

const pageWrap = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "24px",
  width: "100%",
  boxSizing: "border-box",
};

const topBar = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "22px",
};

const eyebrow = {
  margin: 0,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#667085",
  fontWeight: 700,
};

const heading = {
  margin: "6px 0 0",
  fontSize: "34px",
  lineHeight: 1.1,
  color: "#111827",
};

const gridLayout = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "18px",
  marginBottom: "18px",
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
};

const sectionHeaderStyle = {
  marginBottom: "18px",
};

const sectionHeadingWrap = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const cardTitle = {
  margin: 0,
  fontSize: "20px",
  color: "#111827",
};

const mutedText = {
  margin: "4px 0 0",
  color: "#667085",
  fontSize: "14px",
};

const fieldGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const helperNote = {
  margin: "16px 0 0",
  color: "#475467",
  fontSize: "13px",
};

const labelText = {
  display: "block",
  marginBottom: "6px",
  color: "#475467",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const accountSummary = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "16px",
  background: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  marginBottom: "16px",
};

const accountBadge = {
  background: "#111827",
  color: "#fff",
  padding: "8px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  maxWidth: "180px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const strongText = {
  fontSize: "16px",
  color: "#111827",
};

const locationGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "16px",
};

const locationBoxStyle = {
  padding: "14px 16px",
  background: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
};

const locationValue = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#111827",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: "6px",
  padding: "11px 12px",
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  fontSize: "14px",
  background: "#fff",
  color: "#111827",
  outline: "none",
};

const primaryButton = {
  marginTop: "18px",
  padding: "11px 18px",
  border: "none",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "700",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

const dangerButton = {
  padding: "11px 18px",
  border: "none",
  borderRadius: "10px",
  background: "#ef4444",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "700",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const successMessage = {
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#e8f7ee",
  color: "#176b38",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: "1px solid #bbf7d0",
};

const errorMessage = {
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#fef2f2",
  color: "#b42318",
  border: "1px solid #fecaca",
};

const iconInline = {
  verticalAlign: "middle",
};

export default Settings;