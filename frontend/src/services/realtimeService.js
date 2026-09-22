import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const TOKEN_STORAGE_KEY = "nexserve_token";

export const createRealtimeSocket = () => io(SOCKET_URL, {
  auth: { token: localStorage.getItem(TOKEN_STORAGE_KEY) },
  transports: ["websocket"],
});

export const getMessage = async (jobId) => {
  const response = await fetch(`${API_BASE_URL}/messages/${jobId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_STORAGE_KEY)}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Unable to load messages");
  return data.messages || [];
};

export const sendMessage = async (jobId, text) => {
  const response = await fetch(`${API_BASE_URL}/messages/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(TOKEN_STORAGE_KEY)}`,
    },
    body: JSON.stringify({ text }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Unable to send message");
  return data.message;
};
