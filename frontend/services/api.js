import axios from "axios";

// ── API Base URL ──────────────────────────────────────────────────────────────
// Priority:
//  1. VITE_API_URL env var (set in Vercel dashboard for production)
//  2. localhost:5000 (local development)
//
// IMPORTANT: Never hardcode a production URL here. Always use VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;