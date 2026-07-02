import axios from "axios";

console.log("API URL =", import.meta.env.VITE_API_URL);

export default axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000",
});