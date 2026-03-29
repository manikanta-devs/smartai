import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";

const API_BASE = "http://localhost:5000/api";
const PREMIUM_API_BASE = "http://localhost:8505/premium";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" }
});

// Premium API instance for Claude-powered features
export const premiumAPI = axios.create({
  baseURL: PREMIUM_API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 120000 // Increased timeout for Claude analysis
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("API Request:", config.method?.toUpperCase(), config.url, config.data);
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log("API Response:", res.status, res.data);
    return res;
  },
  async (err: AxiosError) => {
    console.error("API Error:", err.response?.status, err.response?.data);
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: async (email: string, username: string, password: string, firstName?: string, lastName?: string) =>
    api.post("/auth/register", { email, username, password, firstName, lastName }),
  login: async (email: string, password: string) => api.post("/auth/login", { email, password }),
  logout: async () => api.post("/auth/logout"),
  me: async () => api.get("/auth/me"),
  refresh: async (refreshToken: string) => api.post("/auth/refresh", { refreshToken })
};

export default api;
