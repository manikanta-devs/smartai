import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";
import { useAuthStore } from "../store/auth";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur"
  });
  
  const password = watch("password");
  
  const onSubmit = async (data: RegisterForm) => {
    setApiError('');
    try {
      const regRes = await api.post("/auth/register", {
        email: data.email,
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName
      });
      
      if (!regRes.data?.success) {
        throw new Error(regRes.data?.error?.message || "Registration failed");
      }
      
      toast.success("Registered! Logging in...");
      
      const loginRes = await api.post("/auth/login", {
        identifier: data.username,
        password: data.password
      });
      
      if (!loginRes.data?.success) {
        throw new Error(loginRes.data?.error?.message || "Login failed");
      }
      
      useAuthStore.setState({
        accessToken: loginRes.data.data.accessToken,
        user: loginRes.data.data.user
      });
      
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || err.response?.data?.error?.message || err.response?.data?.message || err.toString() || "Registration failed";
      console.error("Registration error:", err);
      setApiError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#04050f] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-indigo-950/25">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-r from-indigo-500 to-cyan-500">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Create Account</h2>
            <p className="text-slate-400 mt-2">Join us to start analyzing your resume</p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-400/20 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-rose-300 mr-2" />
                <p className="text-sm text-rose-100">{apiError}</p>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                placeholder="Mani"
                className="w-full px-4 py-3 bg-[#04050f] border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition text-slate-100 placeholder-slate-500"
                {...register("firstName")}
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
                Last Name (optional)
              </label>
              <input
                type="text"
                id="lastName"
                placeholder="Kumar"
                className="w-full px-4 py-3 bg-[#04050f] border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition text-slate-100 placeholder-slate-500"
                {...register("lastName")}
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                required
                placeholder="manikumar"
                className="w-full px-4 py-3 bg-[#04050f] border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition text-slate-100 placeholder-slate-500"
                {...register("username")}
              />
              {errors.username && <p className="text-xs text-rose-300 mt-1">✕ {errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[#04050f] border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition text-slate-100 placeholder-slate-500"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-rose-300 mt-1">✕ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#04050f] border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition text-slate-100 placeholder-slate-500"
                minLength={8}
                {...register("password")}
              />
              <p className="text-xs text-slate-500 mt-1">At least 8 characters</p>
              {errors.password && <p className="text-xs text-rose-300 mt-1">✕ {errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#04050f] border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition text-slate-100 placeholder-slate-500"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-xs text-rose-300 mt-1">✕ {errors.confirmPassword.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-lg shadow-indigo-950/25 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-cyan-300 hover:text-cyan-200 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6 opacity-90">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
