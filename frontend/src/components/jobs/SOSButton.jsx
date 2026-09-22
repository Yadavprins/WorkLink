import { Siren } from "lucide-react";
import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SOSButton = ({ jobId }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const raiseSOS = () => {
    if (!window.confirm("Raise an SOS alert for this active job?")) return;
    setLoading(true);
    setError("");
    const finish = (latitude = null, longitude = null) => fetch(`${API_BASE_URL}/safety/jobs/${jobId}/sos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("nexserve_token")}` },
      body: JSON.stringify({ latitude, longitude, message: "Emergency assistance requested from the active job" }),
    }).then((response) => response.json()).then((data) => {
      if (!data.success) throw new Error(data.message || "Unable to raise SOS");
      setSent(true);
    }).catch((sosError) => setError(sosError.message)).finally(() => setLoading(false));
    if (!navigator.geolocation) return finish();
    navigator.geolocation.getCurrentPosition((position) => finish(position.coords.latitude, position.coords.longitude), () => finish());
  };

  return (
    <div className="sos-control">
      <button type="button" className="sos-button" onClick={raiseSOS} disabled={loading || sent} title="Raise SOS emergency alert">
        <Siren size={18} /> {sent ? "SOS sent" : loading ? "Sending..." : "SOS Emergency"}
      </button>
      {error && <small className="sos-error">{error}</small>}
    </div>
  );
};

export default SOSButton;
