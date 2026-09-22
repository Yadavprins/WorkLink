const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("nexserve_token")}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Payment request failed");
  return data;
};

const paymentService = {
  getWallet: () => request("/payments/wallet"),
  topUp: (amount) => request("/payments/wallet/top-up", {
    method: "POST",
    body: JSON.stringify({ amount }),
  }),
  payJob: (jobId, paymentMethod, promoCode) => request(`/payments/jobs/${jobId}/pay`, {
    method: "POST",
    body: JSON.stringify({ paymentMethod, promoCode }),
  }),
};

export default paymentService;
