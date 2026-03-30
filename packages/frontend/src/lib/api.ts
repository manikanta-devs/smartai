import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const PREMIUM_API_BASE = API_BASE;

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" }
});

// Free-only app: keep a single API client for all requests
export const premiumAPI = api;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, string | undefined>)['Content-Type'];
    delete (config.headers as Record<string, string | undefined>)['content-type'];
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
  login: async (identifier: string, password: string) => api.post("/auth/login", { identifier, password }),
  logout: async () => api.post("/auth/logout"),
  me: async () => api.get("/auth/me"),
  refresh: async (refreshToken: string) => api.post("/auth/refresh", { refreshToken })
};

export default api;
