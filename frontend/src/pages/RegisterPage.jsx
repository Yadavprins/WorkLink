import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    LockKeyhole,
    Mail,
    MapPin,
    Navigation,
    Phone,
    User,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [role, setRole] = useState("customer");

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        city: "",
        area: "",
        skills: "",
        experience: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [coordinates, setCoordinates] = useState({
        latitude: null,
        longitude: null,
    });

    const roleNames = {
        customer: "Customer",
        worker: "Worker",
    };

    const handleRoleChange = (selectedRole) => {
        setRole(selectedRole);
        setError("");
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (error) {
            setError("");
        }
    };

    const detectAddress = () => {
        if (!navigator.geolocation) {
            setError("Location is not supported by this browser.");
            return;
        }

        setLocating(true);
        setError("");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                setCoordinates({ latitude, longitude });

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                        { headers: { Accept: "application/json" } }
                    );
                    const data = await response.json();
                    const address = data?.address || {};

                    setForm((previous) => ({
                        ...previous,
                        city:
                            address.city ||
                            address.town ||
                            address.village ||
                            address.municipality ||
                            address.county ||
                            previous.city,
                        area:
                            address.suburb ||
                            address.neighbourhood ||
                            address.residential ||
                            address.road ||
                            previous.area,
                    }));
                } catch {
                    setError(
                        "Location detected, but address could not be filled. Enter it manually."
                    );
                } finally {
                    setLocating(false);
                }
            },
            () => {
                setLocating(false);
                setError("Please allow location access or enter address manually.");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const name = form.name.trim();
        const email = form.email.trim().toLowerCase();
        const phone = form.phone.trim();
        const password = form.password;
        const city = form.city.trim();
        const area = form.area.trim();

        if (!name) {
            setError("Please enter your name.");
            return;
        }

        if (!email) {
            setError("Please enter your email.");
            return;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email.");
            return;
        }

        if (!phone) {
            setError("Please enter your phone number.");
            return;
        }

        if (!password) {
            setError("Please enter a password.");
            return;
        }

        if (password.length < 4) {
            setError(
                "Password must contain at least 4 characters."
            );
            return;
        }

        if (!city) {
            setError("Please enter your city.");
            return;
        }

        if (!area) {
            setError("Please enter your area.");
            return;
        }

        if (role === "worker" && !form.skills.trim()) {
            setError("Please enter at least one skill.");
            return;
        }

        try {
            setLoading(true);

            const registeredUser = await register({
                name,
                email,
                phone,
                password,
                city,
                area,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                skills: form.skills,
                experience: form.experience,
                role,
            });

            if (registeredUser?.role === "worker") {
                navigate("/worker/dashboard");
            } else {
                navigate("/customer/dashboard");
            }
        } catch (err) {
            console.error(
                "Registration error:",
                err
            );

            setError(
                err?.message ||
                    "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="login-wrapper">

                <button
                    className="back-button"
                    type="button"
                    onClick={() => navigate("/")}
                    disabled={loading}
                >
                    <ArrowLeft size={17} />
                    Back
                </button>

                <section className="login-card">

                    {/* HEADER */}

                    <div className="login-header">

                        <div className="brand-logo large">
                            N
                        </div>

                        <h1>
                            Create NexServe Account
                        </h1>

                        <p>
                            Register as a{" "}
                            <strong>
                                {roleNames[role]}
                            </strong>{" "}
                            to get started.
                        </p>

                    </div>


                    {/* ROLE SWITCHER */}

                    <div className="role-switcher">

                        <button
                            type="button"
                            className={
                                role === "customer"
                                    ? "role-option active"
                                    : "role-option"
                            }
                            onClick={() =>
                                handleRoleChange(
                                    "customer"
                                )
                            }
                            disabled={loading}
                        >
                            Customer
                        </button>

                        <button
                            type="button"
                            className={
                                role === "worker"
                                    ? "role-option active"
                                    : "role-option"
                            }
                            onClick={() =>
                                handleRoleChange(
                                    "worker"
                                )
                            }
                            disabled={loading}
                        >
                            Worker
                        </button>

                    </div>


                    {/* FORM */}

                    <form onSubmit={handleSubmit}>

                        {/* NAME */}

                        <label>
                            Full Name

                            <div className="input-wrapper">
                                <User size={18} />

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={form.name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    disabled={loading}
                                />
                            </div>
                        </label>


                        {/* EMAIL */}

                        <label>
                            Email

                            <div className="input-wrapper">
                                <Mail size={18} />

                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    disabled={loading}
                                />
                            </div>
                        </label>


                        {/* PHONE */}

                        <label>
                            Phone Number

                            <div className="input-wrapper">
                                <Phone size={18} />

                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Enter your phone number"
                                    value={form.phone}
                                    onChange={handleChange}
                                    autoComplete="tel"
                                    disabled={loading}
                                />
                            </div>
                        </label>


                        {/* PASSWORD */}

                        <label>
                            Password

                            <div className="input-wrapper">
                                <LockKeyhole size={18} />

                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Create a password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    disabled={loading}
                                />
                            </div>
                        </label>


                        {/* CITY */}

                        <label>
                            City

                            <div className="input-wrapper">
                                <MapPin size={18} />

                                <input
                                    type="text"
                                    name="city"
                                    placeholder="Enter your city"
                                    value={form.city}
                                    onChange={handleChange}
                                    autoComplete="address-level2"
                                    disabled={loading}
                                />
                            </div>
                        </label>


                        {/* AREA */}

                        <label>
                            Area

                            <div className="input-wrapper">
                                <MapPin size={18} />

                                <input
                                    type="text"
                                    name="area"
                                    placeholder="Enter your area"
                                    value={form.area}
                                    onChange={handleChange}
                                    autoComplete="address-line1"
                                    disabled={loading}
                                />
                            </div>
                        </label>

                        <button
                            type="button"
                            className="secondary-btn full-width"
                            onClick={detectAddress}
                            disabled={loading || locating}
                        >
                            <Navigation size={17} />
                            {locating ? "Detecting location..." : "Detect Address Automatically"}
                        </button>


                        {/* WORKER FIELDS */}

                        {role === "worker" && (
                            <>
                                <label>
                                    Skills

                                    <div className="input-wrapper">
                                        <BriefcaseBusiness
                                            size={18}
                                        />

                                        <input
                                            type="text"
                                            name="skills"
                                            placeholder="e.g. Plumber, Electrician"
                                            value={form.skills}
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                loading
                                            }
                                        />
                                    </div>
                                </label>

                                <label>
                                    Experience (Years)

                                    <div className="input-wrapper">
                                        <BriefcaseBusiness
                                            size={18}
                                        />

                                        <input
                                            type="number"
                                            name="experience"
                                            placeholder="e.g. 2"
                                            min="0"
                                            value={
                                                form.experience
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                loading
                                            }
                                        />
                                    </div>
                                </label>
                            </>
                        )}


                        {/* ERROR */}

                        {error && (
                            <div className="form-error">
                                {error}
                            </div>
                        )}


                        {/* REGISTER */}

                        <button
                            className="primary-button full"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Create Account"}

                            {!loading && (
                                <ArrowRight size={18} />
                            )}
                        </button>

                    </form>


                    {/* LOGIN */}

                    <div className="divider">
                        <span>OR</span>
                    </div>

                    <button
                        className="demo-button"
                        type="button"
                        onClick={() =>
                            navigate(
                                `/login?role=${role}`
                            )
                        }
                        disabled={loading}
                    >
                        Already have an account? Login
                    </button>

                    <p className="demo-note">
                        Your account will be created
                        directly in NexServe.
                    </p>

                </section>
            </div>
        </main>
    );
}

export default RegisterPage;