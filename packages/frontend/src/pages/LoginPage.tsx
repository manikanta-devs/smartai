import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur"
  });
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log("Login attempt with:", data);
      const res = await api.post("/auth/login", data);
      console.log("Login response:", res.data);
      
      if (res.data?.data?.accessToken && res.data?.data?.user) {
        setAccessToken(res.data.data.accessToken);
        setUser(res.data.data.user);
        toast.success("Logged in successfully!");
        // Small delay to ensure state is updated
        setTimeout(() => navigate("/dashboard"), 100);
      } else {
        toast.error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.response?.data?.error?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Error Messages */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  {Object.values(errors)[0]?.message && (
                    <p>{Object.values(errors)[0]?.message as string}</p>
                  )}
                </div>
              </div>
            </div>
          )}

            {/* Register Link */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up here
              </button>
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter username"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                {...register("username")}
              />
              {errors.username && <p className="text-xs text-red-600 mt-1">✕ {errors.username.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">✕ {errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="text-center mt-4">
            <button
              onClick={() => toast.info("Password reset will be available soon")}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white text-sm mt-6 opacity-90">
          Keep your credentials safe. Never share your password.
        </p>
      </div>
    </div>
  );
}
