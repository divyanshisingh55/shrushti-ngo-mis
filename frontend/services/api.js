import axios from "axios";

const getBaseURL = () => {
  // Explicit env var always wins (set VITE_API_URL=https://... in Vercel dashboard if needed)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // On Vercel (or any deployed host) — call /api on the same domain (no CORS, no Railway)
  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  // Local development
  return "http://localhost:5000";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Auto-attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;