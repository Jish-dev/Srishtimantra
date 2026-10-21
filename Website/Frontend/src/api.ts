
import axios from "axios";

const api = axios.create({
  baseURL: (
    import.meta.env.VITE_API_URL ||
    "https://srishtimantra-1.onrender.com/api"
  ).replace(/\/+$/, ""),
  timeout: 20000,
});

export default api;
