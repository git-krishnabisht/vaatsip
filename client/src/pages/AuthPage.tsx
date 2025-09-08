import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Eye,
  EyeOff,
  MessageSquare,
  Mail,
  Lock,
  User,
  AlertCircle,
} from "lucide-react";

interface Cred {
  name?: string;
  email: string;
  password: string;
}

function AuthPage() {
  const { isLoggedIn, checkAuthStatus } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [cred, setCred] = useState<Cred>({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (error === "auth_failed") {
      setFormError("Authentication failed. Please try again.");
    }
  }, [error]);

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    setCred({
      ...cred,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    const url =
      authTab === "signin"
        ? "http://localhost:50136/api/auth/sign-in"
        : "http://localhost:50136/api/auth/sign-up";

    const payload =
      authTab === "signin"
        ? { email: cred.email, password: cred.password }
        : cred;

    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed ${res.status}`);
      }

      const data = await res.json();
      console.log("Success:", data);

      setCred({ name: "", email: "", password: "" });
      await checkAuthStatus();
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Error:", err);
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: "signin" | "signup") => {
    setAuthTab(tab);
    setFormError(null);
    setCred({ name: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-xl">
            <MessageSquare className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Vaatsip
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
            {authTab === "signin"
              ? "Sign in to your account"
              : "Create your account"}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex bg-gray-50 p-2 m-4 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTabChange("signin")}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                authTab === "signin"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                authTab === "signup"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="p-6 pt-2 space-y-6">
            {formError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-red-800 text-sm font-medium">
                  {formError}
                </div>
              </div>
            )}

            {/* Name field for signup */}
            {authTab === "signup" && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-200 transition-all duration-200 font-medium"
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={cred.name || ""}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-200 transition-all duration-200 font-medium"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={cred.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-200 transition-all duration-200 font-medium"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={cred.password}
                  onChange={handleFormChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {authTab === "signin"
                      ? "Signing in..."
                      : "Creating account..."}
                  </span>
                </div>
              ) : authTab === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-gray-500 text-sm font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Google Sign In */}
            <a
              href="http://localhost:50136/auth/google"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md font-bold text-gray-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285f4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34a853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#ea4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </a>

            {/* Switch auth mode */}
            {authTab === "signin" && (
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleTabChange("signup")}
                    className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                  >
                    Sign up here
                  </button>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm font-medium">
            By continuing, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-bold">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-bold">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
