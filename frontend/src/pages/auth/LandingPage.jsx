import { ArrowRight, MapPin, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="landing-page">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-logo">N</div>

          <div>
            <h1>NexServe</h1>
            <span>Local Work Marketplace</span>
          </div>
        </div>

        <button
          className="nav-login"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <MapPin size={16} />
            Hyper-local services
          </div>

          <h2>
            Kaam bhi local,
            <br />
            <span>worker bhi local.</span>
          </h2>

          <p>
            NexServe connects customers with skilled local
            workers for everyday services — quickly,
            conveniently and securely.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
                onClick={() => navigate("/role-selection")}
            >
              Get Started
              <ArrowRight size={19} />
            </button>

            <button
              className="secondary-button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card main-card">
            <div className="visual-icon">
              <Users size={28} />
            </div>

            <h3>Find the right worker</h3>

            <p>
              Connect with nearby professionals based
              on your service requirement.
            </p>

            <div className="worker-preview">
              <div className="avatar">AS</div>

              <div>
                <strong>Amit Sharma</strong>
                <small>Plumber · 4.8 ★</small>
              </div>

              <span className="verified">
                <ShieldCheck size={17} />
              </span>
            </div>
          </div>

          <div className="floating-card location-card">
            <MapPin size={20} />
            <div>
              <strong>Nearby Workers</strong>
              <small>Within your locality</small>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <MapPin size={22} />
          <div>
            <strong>Local Matching</strong>
            <p>Find workers near your location.</p>
          </div>
        </div>

        <div className="feature">
          <ShieldCheck size={22} />
          <div>
            <strong>Verified Workers</strong>
            <p>Choose trusted service professionals.</p>
          </div>
        </div>

        <div className="feature">
          <Users size={22} />
          <div>
            <strong>Simple Booking</strong>
            <p>Post your work and get it done.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;