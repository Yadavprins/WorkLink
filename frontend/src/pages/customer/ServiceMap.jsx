import {
  ArrowRight,
  Clock3,
  Crosshair,
  Heart,
  Home,
  MapPin,
  Menu,
  Navigation,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SOSButton from "../../components/jobs/SOSButton";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ServiceMap = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [location, setLocation] = useState(user?.location || null);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/customers/dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("nexserve_token")}` },
    }).then((response) => response.json()).then((data) => setDashboard(data.dashboard)).catch(() => {});
  }, []);

  const activeJob = useMemo(() => (dashboard?.recentJobs || []).find((job) => ["accepted", "on_the_way", "arrived", "in_progress"].includes(job.status)), [dashboard]);
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
  const mapCenter = hasLocation ? `${longitude - 0.015},${latitude - 0.015},${longitude + 0.015},${latitude + 0.015}` : "83.35,26.72,83.40,26.76";
  const marker = hasLocation ? `${latitude},${longitude}` : "26.75,83.37";
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(mapCenter)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocating(false);
    }, () => setLocating(false), { enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <div className="service-map-page">
      <iframe className="service-map-canvas" title="NexServe service area map" src={mapUrl} />
      <div className="service-map-shade" />

      <header className="service-map-topbar">
        <Link to="/customer/dashboard" className="map-icon-button" aria-label="Open dashboard"><Menu size={20} /></Link>
        <div className="map-brand"><span>N</span><strong>NexServe</strong></div>
        <button type="button" className="map-avatar" aria-label="Open profile">{(user?.name || "C").charAt(0).toUpperCase()}</button>
      </header>

      <div className="service-map-search">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Where do you need help?" />
        <button type="button" onClick={locateMe} title="Use current location" aria-label="Use current location"><Crosshair size={17} /></button>
      </div>

      <div className="service-map-shortcuts">
        <button type="button"><Clock3 size={15} /> Recent</button>
        <button type="button"><Home size={15} /> Home</button>
        <button type="button"><Heart size={15} /> Saved</button>
        <button type="button"><Sparkles size={15} /> Emergency</button>
      </div>

      <button type="button" className="map-locate-button" onClick={locateMe} aria-label="Center map" title={locating ? "Locating..." : "Center map"}><Navigation size={19} /></button>

      {activeJob && <div className="map-active-job">
        <div className="map-active-icon"><Navigation size={18} /></div>
        <div><span>Worker is on the way</span><strong>{activeJob.title}</strong><small>Live location is being shared</small></div>
        <Link to={`/customer/jobs/${activeJob._id || activeJob.id}`} aria-label="Open active job"><ArrowRight size={18} /></Link>
      </div>}

      <section className="map-bottom-sheet">
        <div className="sheet-handle" />
        <div className="sheet-heading"><div><span className="sheet-kicker">NEXSERV ON-DEMAND</span><h1>What can we fix today?</h1></div><span className="sheet-status"><span /> Online</span></div>
        <div className="sheet-location"><MapPin size={18} /><div><span>Service location</span><strong>{hasLocation ? "Current location" : user?.area || "Set your service location"}</strong></div><button type="button" onClick={locateMe}>{locating ? "..." : "Change"}</button></div>
        <div className="sheet-actions">
          <Link to="/customer/create-job" className="sheet-primary"><Plus size={18} /> Request a worker</Link>
          <Link to="/workers" className="sheet-secondary"><UserRound size={17} /> Browse pros</Link>
        </div>
        <div className="sheet-trust"><ShieldAlert size={16} /><span>Verified professionals near you</span><span className="trust-stars"><Star size={13} fill="currentColor" /> 4.8 average</span></div>
        {activeJob && <SOSButton jobId={activeJob._id || activeJob.id} />}
      </section>
    </div>
  );
};

export default ServiceMap;
