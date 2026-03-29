/**
 * Multi-Backend API Configuration
 * Supports both Express and FastAPI backends
 */

import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";

// Backend options
export const BACKENDS = {
  EXPRESS: {
    name: "Express (TypeScript)",
    url: "http://localhost:4000/api",
    port: 4000,
    type: "express"
  },
  FASTAPI: {
    name: "FastAPI (Python)",
    url: "http://localhost:8000",
    port: 8000,
    type: "fastapi"
  }
};

// Set default backend (change to BACKENDS.FASTAPI to switch)
const DEFAULT_BACKEND = BACKENDS.EXPRESS;

// Create axios instances for each backend
export const apiExpress = axios.create({
  baseURL: BACKENDS.EXPRESS.url,
  headers: { "Content-Type": "application/json" }
});

export const apiFastAPI = axios.create({
  baseURL: BACKENDS.FASTAPI.url,
  headers: { "Content-Type": "application/json" }
});

// Active API instance
let activeAPI = DEFAULT_BACKEND.type === "fastapi" ? apiFastAPI : apiExpress;

// Add request interceptor for tokens
const setupInterceptors = (apiInstance: any) => {
  apiInstance.interceptors.request.use((config: any) => {
    const token = useAuthStore.getState().accessToken;
    if (token && DEFAULT_BACKEND.type === "express") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiInstance.interceptors.response.use(
    (res: any) => res,
    async (err: AxiosError) => {
      if (err.response?.status === 401 && DEFAULT_BACKEND.type === "express") {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }
  );
};

setupInterceptors(apiExpress);
setupInterceptors(apiFastAPI);

/**
 * Switch between backends at runtime
 */
export const switchBackend = (backendType: "express" | "fastapi") => {
  activeAPI = backendType === "fastapi" ? apiFastAPI : apiExpress;
  localStorage.setItem("activeBackend", backendType);
};

/**
 * Get current active backend info
 */
export const getCurrentBackend = () => ({
  name: DEFAULT_BACKEND.name,
  type: DEFAULT_BACKEND.type,
  url: DEFAULT_BACKEND.url
});

export default activeAPI;

/**
 * Resume Analysis API
 */
export const analysisAPI = {
  // Express route
  analyzeExpressResume: (resumeId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiExpress.post(`/resumes/${resumeId}/analyze`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  // FastAPI route
  analyzeFastAPIResume: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFastAPI.post("/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  // Smart route - uses active backend
  analyze: async (file: File, resumeId?: string) => {
    if (DEFAULT_BACKEND.type === "fastapi") {
      return analysisAPI.analyzeFastAPIResume(file);
    } else {
      return analysisAPI.analyzeExpressResume(resumeId || "", file);
    }
  }
};

/**
 * Resume Matching API
 */
export const matchingAPI = {
  // Express route
  matchExpress: (resumeId: string, jobDescription: string) =>
    apiExpress.post(`/resumes/${resumeId}/match-job`, { jobDescription }),

  // FastAPI route
  matchFastAPI: (resume: string, jobDescription: string) =>
    apiFastAPI.post("/match", { resume, job_description: jobDescription }),

  // Smart route
  match: (resume: string, jobDescription: string, resumeId?: string) => {
    if (DEFAULT_BACKEND.type === "fastapi") {
      return matchingAPI.matchFastAPI(resume, jobDescription);
    } else {
      return matchingAPI.matchExpress(resumeId || "", jobDescription);
    }
  }
};

/**
 * Skills Gap API
 */
export const skillsAPI = {
  // Express route
  gapExpress: (resumeId: string, jobDescription: string) =>
    apiExpress.post(`/resumes/${resumeId}/ats-score`, { jobDescription }),

  // FastAPI route
  gapFastAPI: (resume: string, jobDescription: string) =>
    apiFastAPI.post("/skills-gap", { resume, job_description: jobDescription }),

  // Smart route
  gap: (resume: string, jobDescription: string, resumeId?: string) => {
    if (DEFAULT_BACKEND.type === "fastapi") {
      return skillsAPI.gapFastAPI(resume, jobDescription);
    } else {
      return skillsAPI.gapExpress(resumeId || "", jobDescription);
    }
  }
};

/**
 * Job Search API
 */
export const jobsAPI = {
  // Express route
  searchExpress: (role: string) =>
    apiExpress.get(`/jobs?role=${encodeURIComponent(role)}`),

  // FastAPI route
  searchFastAPI: (role: string) =>
    apiFastAPI.get(`/jobs/${encodeURIComponent(role)}`),

  // Smart route
  search: (role: string) => {
    if (DEFAULT_BACKEND.type === "fastapi") {
      return jobsAPI.searchFastAPI(role);
    } else {
      return jobsAPI.searchExpress(role);
    }
  }
};

/**
 * Resume Rewrite API
 */
export const rewriteAPI = {
  // Express route
  rewriteExpress: (resumeId: string, jobTitle: string) =>
    apiExpress.post(`/resumes/${resumeId}/improvements`, { jobTitle }),

  // FastAPI route
  rewriteFastAPI: (resume: string, jobTitle: string) =>
    apiFastAPI.post("/rewrite", { resume, job_title: jobTitle }),

  // Smart route
  rewrite: (resume: string, jobTitle: string, resumeId?: string) => {
    if (DEFAULT_BACKEND.type === "fastapi") {
      return rewriteAPI.rewriteFastAPI(resume, jobTitle);
    } else {
      return rewriteAPI.rewriteExpress(resumeId || "", jobTitle);
    }
  }
};

export const authAPI = {
  register: async (email: string, username: string, password: string, firstName?: string, lastName?: string) =>
    apiExpress.post("/auth/register", { email, username, password, firstName, lastName }),
  login: async (email: string, password: string) => 
    apiExpress.post("/auth/login", { email, password }),
  logout: async () => apiExpress.post("/auth/logout"),
  me: async () => apiExpress.get("/auth/me"),
  refresh: async (refreshToken: string) => apiExpress.post("/auth/refresh", { refreshToken })
};
