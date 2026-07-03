import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Check if running on Vercel environment
  if (window.location.hostname === "shrushti-ngo-mis.vercel.app" || window.location.hostname.endsWith(".vercel.app")) {
    return "https://shrushti-ngo-mis-production.up.railway.app";
  }
  // Local development fallback
  return `${window.location.protocol}//${window.location.hostname}:5000`;
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