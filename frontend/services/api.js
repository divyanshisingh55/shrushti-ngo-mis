import axios from "axios";

const getBaseURL = () => {
  // Explicit override always wins (set VITE_API_URL in Vercel env vars)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Production Vercel — point to Railway backend
  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
    return "https://shrushti-ngo-mis-production.up.railway.app";
  }
  // Local development
  return "http://localhost:5000";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000
});

// Attach JWT token to every request
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

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;