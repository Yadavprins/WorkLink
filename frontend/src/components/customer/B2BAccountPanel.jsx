import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const B2BAccountPanel = () => {
  const [form, setForm] = useState({ organizationType: "society", organizationName: "", contactName: "", contactPhone: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = localStorage.getItem("nexserve_token");

  useEffect(() => {
    fetch(`${API_BASE_URL}/customer-features/business-account`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then((data) => {
        if (data.account) setForm({ organizationType: data.account.organizationType, organizationName: data.account.organizationName, contactName: data.account.contactName, contactPhone: data.account.contactPhone });
      })
      .catch(() => {});
  }, [token]);

  const save = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const response = await fetch(`${API_BASE_URL}/customer-features/business-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, sites: [] }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.message || "Unable to save business account");
    else setMessage("Business account saved. You can use it for organization bookings.");
  };

  return (
    <section className="dashboard-card b2b-account-panel">
      <div className="details-card-header"><h2><Building2 size={19} /> B2B Account</h2><span>Societies · Hotels · Offices</span></div>
      <form onSubmit={save} className="b2b-account-form">
        <select value={form.organizationType} onChange={(event) => setForm({ ...form, organizationType: event.target.value })}><option value="society">Society</option><option value="hotel">Hotel</option><option value="office">Office</option></select>
        <input placeholder="Organization name" value={form.organizationName} onChange={(event) => setForm({ ...form, organizationName: event.target.value })} required />
        <input placeholder="Contact person" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} required />
        <input placeholder="Contact phone" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} required />
        <button type="submit" className="secondary-btn">Save account</button>
      </form>
      {message && <p className="job-action-message success">{message}</p>}
      {error && <p className="job-action-message error">{error}</p>}
    </section>
  );
};

export default B2BAccountPanel;
