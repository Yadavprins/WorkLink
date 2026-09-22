import {
  ArrowLeft,
  AlertTriangle,
  Camera,
  CheckCircle2,
  CalendarClock,
  IndianRupee,
  MapPin,
  Plus,
  X,
  Navigation,
} from "lucide-react";

import {
  useRef,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const CreateJob = () => {
  const navigate = useNavigate();
  const fileInputRef =
    useRef(null);

  const {
    user,
    token,
    updateUser,
  } = useAuth();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    locating,
    setLocating,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    city:
      user?.city || "",
    area:
      user?.area || "",
    minBudget: "",
    maxBudget: "",
  });

  const [
    coordinates,
    setCoordinates,
  ] = useState({
    latitude:
      user?.location?.latitude ??
      null,

    longitude:
      user?.location?.longitude ??
      null,
  });

  const [
    image,
    setImage,
  ] = useState(null);

  const [isEmergency, setIsEmergency] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const defaultCategories = [
    "Plumbing",
    "Electrical",
    "AC & Appliance",
    "Carpentry",
    "Painting",
    "Cleaning",
    "Vehicle Repair",
    "Other",
  ];

  const [categories, setCategories] =
    useState(defaultCategories);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/categories`)
      .then((response) => response.json())
      .then((data) => {
        const remoteCategories = Array.isArray(data?.categories)
          ? data.categories
              .filter((category) => category.isActive !== false)
              .map((category) => category.name)
              .filter(Boolean)
          : [];

        if (remoteCategories.length > 0) {
          setCategories(remoteCategories);
        }
      })
      .catch(() => {
        // Keep the local service list when the catalog is unavailable.
      });
  }, []);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setError("");
  };

  // =====================================================
  // REVERSE GEOCODING
  // =====================================================

  const reverseGeocode = async (
    latitude,
    longitude
  ) => {
    try {
      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
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
        address.village ||
        address.municipality ||
        address.county ||
        "";

      const area =
        address.suburb ||
        address.neighbourhood ||
        address.residential ||
        address.road ||
        "";

      const displayLocation =
        data?.display_name ||
        "";

      return {
        city:
          String(city).trim(),

        area:
          String(area).trim(),

        location:
          String(
            displayLocation
          ).trim(),
      };
    } catch (error) {
      console.error(
        "Reverse geocoding error:",
        error
      );

      return null;
    }
  };

  // =====================================================
  // SAVE CUSTOMER LOCATION
  // =====================================================

  const saveLocationToBackend =
    async (
      latitude,
      longitude
    ) => {
      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/users/location`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  latitude:
                    Number(latitude),

                  longitude:
                    Number(longitude),
                }),
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to save location."
          );
        }

        if (data?.user) {
          updateUser(
            data.user
          );
        } else {
          updateUser({
            location: {
              latitude:
                Number(latitude),

              longitude:
                Number(longitude),
            },
          });
        }
      } catch (error) {
        console.error(
          "Save location error:",
          error
        );
      }
    };

  // =====================================================
  // CURRENT LOCATION
  // =====================================================

  const getCurrentLocation =
    () => {
      setError("");

      if (
        !navigator.geolocation
      ) {
        setError(
          "Geolocation is not supported by your browser."
        );

        return;
      }

      setLocating(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude =
              position.coords
                .latitude;

            const longitude =
              position.coords
                .longitude;

            setCoordinates({
              latitude,
              longitude,
            });

            await saveLocationToBackend(
              latitude,
              longitude
            );

            const address =
              await reverseGeocode(
                latitude,
                longitude
              );

            if (address) {
              setForm(
                (previous) => ({
                  ...previous,

                  location:
                    address.location ||
                    previous.location,

                  city:
                    address.city ||
                    previous.city,

                  area:
                    address.area ||
                    previous.area,
                })
              );

              updateUser({
                city:
                  address.city ||
                  user?.city ||
                  "",

                area:
                  address.area ||
                  user?.area ||
                  "",

                location: {
                  latitude,
                  longitude,
                },
              });
            } else {
              setForm(
                (previous) => ({
                  ...previous,

                  location:
                    previous.location ||
                    "Current location",
                })
              );
            }
          } catch (error) {
            console.error(
              "Location processing error:",
              error
            );

            setError(
              "Location captured, but address could not be detected."
            );
          } finally {
            setLocating(false);
          }
        },

        (geoError) => {
          console.error(
            "Location error:",
            geoError
          );

          let message =
            "Unable to get your current location.";

          if (
            geoError.code === 1
          ) {
            message =
              "Location permission was denied. Please allow location access.";
          } else if (
            geoError.code === 2
          ) {
            message =
              "Your location could not be determined.";
          } else if (
            geoError.code === 3
          ) {
            message =
              "Location request timed out. Please try again.";
          }

          setError(message);
          setLocating(false);
        },

        {
          enableHighAccuracy:
            true,

          timeout: 15000,

          maximumAge: 60000,
        }
      );
    };

  // =====================================================
  // IMAGE
  // =====================================================

  const handleImage = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select a valid image."
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Image size must be less than 5 MB."
      );

      return;
    }

    if (image?.preview) {
      URL.revokeObjectURL(
        image.preview
      );
    }

    setImage({
      file,

      preview:
        URL.createObjectURL(
          file
        ),
    });

    setError("");
  };

  const removeImage = () => {
    if (image?.preview) {
      URL.revokeObjectURL(
        image.preview
      );
    }

    setImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Please enter a job title.";
    }

    if (!form.category) {
      return "Please select a service category.";
    }

    if (
      form.description.trim()
        .length < 5
    ) {
      return "Please describe the problem in at least 5 characters.";
    }

    if (!form.location.trim()) {
      return "Please enter the job location.";
    }

    if (!form.city.trim()) {
      return "City could not be detected. Please set your city in Settings.";
    }

    if (!form.area.trim()) {
      return "Area could not be detected. Please set your area in Settings.";
    }

    if (
      !form.minBudget ||
      Number(form.minBudget) <=
        0
    ) {
      return "Please enter a valid minimum budget.";
    }

    if (
      !form.maxBudget ||
      Number(form.maxBudget) <=
        0
    ) {
      return "Please enter a valid maximum budget.";
    }

    if (
      Number(form.minBudget) >
      Number(form.maxBudget)
    ) {
      return "Maximum budget must be greater than minimum budget.";
    }

    if (
      !Number.isFinite(
        Number(
          coordinates.latitude
        )
      ) ||
      !Number.isFinite(
        Number(
          coordinates.longitude
        )
      )
    ) {
      return "Please use your current location before posting the job.";
    }

    return "";
  };

  // =====================================================
  // SUBMIT JOB
  // =====================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const validationError =
        validateForm();

      if (validationError) {
        setError(
          validationError
        );

        return;
      }

      if (!token) {
        setError(
          "Authentication required. Please login again."
        );

        return;
      }

      setSubmitting(true);
      setError("");

      try {
        const payload = {
          title:
            form.title.trim(),

          description:
            form.description.trim(),

          category:
            form.category,

          requiredSkill: "",

          image: "",

          city:
            form.city.trim(),

          area:
            form.area.trim(),

          latitude:
            Number(
              coordinates.latitude
            ),

          longitude:
            Number(
              coordinates.longitude
            ),

          urgency: isEmergency ? "urgent" : "normal",

          isEmergency,

          scheduledAt: scheduledAt || null,

          bookingType:
            "instant",

          minBudget:
            Number(
              form.minBudget
            ),

          maxBudget:
            Number(
              form.maxBudget
            ),

          location:
            form.location.trim(),
        };

        const response =
          await fetch(
            `${API_BASE_URL}/jobs`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to create job."
          );
        }

        if (
          data?.success === false
        ) {
          throw new Error(
            data?.message ||
              "Unable to create job."
          );
        }

        console.log(
          "Job created successfully:",
          data
        );

        setSuccess(true);

        setTimeout(() => {
          navigate(
            "/customer/my-jobs"
          );
        }, 1200);
      } catch (error) {
        console.error(
          "Create job error:",
          error
        );

        setError(
          error?.message ||
            "Unable to create job. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // =====================================================
  // UI
  // =====================================================

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
          <Link
            to="/customer/dashboard"
            className="back-btn"
          >
            <ArrowLeft
              size={18}
            />

            Back to Dashboard
          </Link>

          <section className="create-job-heading">
            <div>
              <span className="page-eyebrow">
                NEW SERVICE REQUEST
              </span>

              <h1>
                Post a Job
              </h1>

              <p>
                Tell us what you need
                and find a skilled
                worker near you.
              </p>
            </div>
          </section>

          {success ? (
            <div className="job-success-card">
              <div className="success-icon">
                <CheckCircle2
                  size={42}
                />
              </div>

              <h2>
                Job Posted Successfully!
              </h2>

              <p>
                Your service request
                has been created.
                Redirecting to your
                jobs...
              </p>
            </div>
          ) : (
            <form
              className="create-job-layout"
              onSubmit={
                handleSubmit
              }
            >
              <section className="create-job-main">
                {/* JOB INFORMATION */}

                <div className="form-card">
                  <div className="form-card-header">
                    <h2>
                      Job Information
                    </h2>

                    <p>
                      Provide basic
                      information about
                      the service you
                      need.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="title">
                      Job Title
                      <span>*</span>
                    </label>

                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={
                        form.title
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Bathroom Pipe Repair"
                      maxLength={100}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">
                      Service Category
                      <span>*</span>
                    </label>

                    <select
                      id="category"
                      name="category"
                      value={
                        form.category
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="">
                        Select a category
                      </option>

                      {categories.map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category
                            }
                            value={
                              category
                            }
                          >
                            {
                              category
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">
                      Describe Your Problem
                      <span>*</span>
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Explain what needs to be repaired, installed or serviced..."
                      rows={6}
                      maxLength={1000}
                    />

                    <small>
                      {
                        form
                          .description
                          .length
                      }
                      /1000
                    </small>
                  </div>

                  {/* LOCATION */}

                  <div className="form-group">
                    <label htmlFor="location">
                      Job Location
                      <span>*</span>
                    </label>

                    <div className="input-with-icon">
                      <MapPin
                        size={18}
                      />

                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={
                          form.location
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Use current location"
                      />
                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        getCurrentLocation
                      }
                      disabled={
                        locating
                      }
                      style={{
                        marginTop:
                          "10px",
                      }}
                    >
                      <Navigation
                        size={17}
                      />

                      {locating
                        ? "Getting Location..."
                        : coordinates.latitude !==
                          null
                        ? "Location Captured"
                        : "Use Current Location"}
                    </button>

                    {coordinates.latitude !==
                      null && (
                      <small
                        style={{
                          display:
                            "block",

                          marginTop:
                            "8px",
                        }}
                      >
                        GPS location
                        captured
                        successfully.

                        {form.city &&
                          ` ${form.city}`}

                        {form.area &&
                          `, ${form.area}`}
                      </small>
                    )}
                  </div>
                </div>

                {/* BUDGET */}

                <div className="form-card">
                  <div className="form-card-header">
                    <h2>
                      Estimated Budget
                    </h2>

                    <p>
                      Set an approximate
                      amount you are
                      willing to pay.
                    </p>
                  </div>

                  <div className="budget-grid">
                    <div className="form-group">
                      <label htmlFor="minBudget">
                        Minimum Budget
                        <span>*</span>
                      </label>

                      <div className="input-with-icon">
                        <IndianRupee
                          size={17}
                        />

                        <input
                          id="minBudget"
                          name="minBudget"
                          type="number"
                          min="1"
                          value={
                            form.minBudget
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="300"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="maxBudget">
                        Maximum Budget
                        <span>*</span>
                      </label>

                      <div className="input-with-icon">
                        <IndianRupee
                          size={17}
                        />

                        <input
                          id="maxBudget"
                          name="maxBudget"
                          type="number"
                          min="1"
                          value={
                            form.maxBudget
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-card booking-options-card">
                  <div className="form-card-header">
                    <h2>Booking Options</h2>
                    <p>Choose priority or schedule the service for later.</p>
                  </div>
                  <label className="booking-option-toggle">
                    <input type="checkbox" checked={isEmergency} onChange={(event) => setIsEmergency(event.target.checked)} />
                    <AlertTriangle size={17} />
                    <span><strong>Emergency service</strong><small>Prioritize this request for the fastest available response.</small></span>
                  </label>
                  <div className="form-group">
                    <label htmlFor="scheduledAt"><CalendarClock size={16} /> Schedule date and time</label>
                    <input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} />
                  </div>
                </div>

                {/* IMAGE */}

                <div className="form-card">
                  <div className="form-card-header">
                    <h2>
                      Add Photos
                    </h2>

                    <p>
                      A photo can help
                      workers understand
                      the problem faster.
                    </p>
                  </div>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={
                      handleImage
                    }
                  />

                  {!image ? (
                    <button
                      type="button"
                      className="upload-box"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                    >
                      <div className="upload-icon">
                        <Camera
                          size={23}
                        />
                      </div>

                      <strong>
                        Upload a photo
                      </strong>

                      <span>
                        PNG, JPG or JPEG
                        up to 5 MB
                      </span>
                    </button>
                  ) : (
                    <div className="image-preview">
                      <img
                        src={
                          image.preview
                        }
                        alt="Job preview"
                      />

                      <button
                        type="button"
                        onClick={
                          removeImage
                        }
                        className="remove-image"
                      >
                        <X
                          size={17}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* SIDE SUMMARY */}

              <aside className="create-job-side">
                <div className="form-card">
                  <div className="form-card-header">
                    <h2>
                      Post Your Request
                    </h2>

                    <p>
                      Review your
                      information before
                      posting.
                    </p>
                  </div>

                  {error && (
                    <div className="form-error">
                      {error}
                    </div>
                  )}

                  <div className="request-summary">
                    <div>
                      <span>
                        Service
                      </span>

                      <strong>
                        {form.category ||
                          "Not selected"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Budget
                      </span>

                      <strong>
                        {form.minBudget &&
                        form.maxBudget
                          ? `₹${form.minBudget} - ₹${form.maxBudget}`
                          : "Not set"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Location
                      </span>

                      <strong>
                        {form.location ||
                          "Not added"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        City
                      </span>

                      <strong>
                        {form.city ||
                          "Not detected"}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="primary-btn full-width submit-job-btn"
                    disabled={
                      submitting
                    }
                  >
                    {submitting ? (
                      "Posting..."
                    ) : (
                      <>
                        <Plus
                          size={18}
                        />

                        Post Job
                      </>
                    )}
                  </button>
                </div>

                <div className="tip-card">
                  <strong>
                    Tip
                  </strong>

                  <p>
                    Add clear details
                    and photos to help
                    workers understand
                    your requirement
                    and provide accurate
                    estimates.
                  </p>
                </div>
              </aside>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

export default CreateJob;