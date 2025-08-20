import { createContext, useContext, useEffect, useState } from "react";

interface User {
  googleId: string;
  email: string;
  name: string;
}

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
      const res = await fetch("http://localhost:50136/api/auth/oauth-signin", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        let data = await res.json();
        setIsLoggedIn(false);
        setUser(null);
        console.error("ERROR: ", data.body.message, "\nsign-in, or check your network connection");
        return;
      }

      const data = await res.json();

      if (data.body?.signed_in === true) {
        setIsLoggedIn(true);
        setUser(data.body.user);
        console.log("Login successful");
      } else {
        setIsLoggedIn(false);
        setUser(null);
        console.log("Login failed");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const signout = async () => {
    try {
      const res = await fetch("http://localhost:50136/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setIsLoggedIn(false);
        setUser(null);
        console.log("Sign out successful");
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
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
