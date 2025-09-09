import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "../models/Messages";

const baseURL =
  import.meta.env.VITE_API_BASE || "https://vaatsip-web.onrender.com/api";

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  setIsLoggedIn: (value: boolean) => void;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  signout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const checkAuthStatus = async () => {
    try {
      setAuthLoading(true);

      // Debug: Log cookies before making request
      console.log("Checking auth status...");
      console.log("Current cookies:", document.cookie);

      const res = await fetch(`${baseURL}/auth/oauth-signin`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Auth check response status:", res.status);

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
        }

        console.log("Auth check failed:", errorData);
        setIsLoggedIn(false);
        setUser(null);

        // Only log error if it's not a normal "not authenticated" case
        if (res.status !== 404 && res.status !== 401) {
          console.error("Unexpected auth error:", errorData);
        }
        return;
      }

      const data = await res.json();
      console.log("Auth check response data:", data);

      if (data.body?.signed_in === true && data.body?.user) {
        setIsLoggedIn(true);
        setUser(data.body.user);
        console.log(
          "Authentication successful for user:",
          data.body.user.email
        );
      } else {
        setIsLoggedIn(false);
        setUser(null);
        console.log("User not authenticated");
      }
    } catch (error) {
      console.error("Network error during auth check:", error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const signout = async () => {
    try {
      console.log("Signing out...");
      const res = await fetch(`${baseURL}/auth/sign-out`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setIsLoggedIn(false);
        setUser(null);
        console.log("Sign out successful");

        // Clear any remaining cookies on client side
        document.cookie =
          "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.vercel.app;";
        document.cookie =
          "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      } else {
        console.error("Sign out request failed:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("Network error during sign out:", error);
      // Still clear local state even if network request fails
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  // Initial auth check on app load
  useEffect(() => {
    // Add a small delay to ensure any cookies from redirects are set
    const timeoutId = setTimeout(() => {
      checkAuthStatus();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        setIsLoggedIn,
        authLoading,
        setUser,
        signout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
