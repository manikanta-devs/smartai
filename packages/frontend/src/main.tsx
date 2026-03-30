import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "./index.css";

import { LandingPage } from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import IntegratedDashboard from "./pages/IntegratedDashboard";
import UploadPage from "./pages/UploadPage";
import JobsPage from "./pages/JobsPage";
import ProfilePage from "./pages/ProfilePage";
import { ResumeDetailPagePremium } from "./pages/ResumeDetailPagePremium";
import { WorkspaceShell } from "./components/WorkspaceShell";
import { useAuthStore } from "./store/auth";

function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
        <Route element={<WorkspaceShell />}>
          <Route path="dashboard" element={<IntegratedDashboard />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="resume/:id" element={<ResumeDetailPagePremium />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
