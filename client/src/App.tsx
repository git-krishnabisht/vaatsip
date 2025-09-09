import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import { UserDetailsProvider } from "./contexts/UserDetailsProvider";
import ErrorBoundary from "./components/ErrorBoundry";
import Loading from "./components/Loading";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg transition-all duration-300 ${
        isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      <div className="flex items-center space-x-2 text-sm font-medium">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <NetworkStatus />
          <Routes>
            <Route
              path="/auth-google"
              element={
                <ErrorBoundary>
                  <AuthPage />
                </ErrorBoundary>
              }
            />

            <Route element={<ProtectedLayout />}>
              <Route
                path="/"
                element={
                  <ErrorBoundary>
                    <UserDetailsProvider>
                      <Dashboard />
                    </UserDetailsProvider>
                  </ErrorBoundary>
                }
              />
              <Route
                path="u/:receiver_id"
                element={
                  <ErrorBoundary>
                    <UserDetailsProvider>
                      <Dashboard />
                    </UserDetailsProvider>
                  </ErrorBoundary>
                }
              />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function ProtectedLayout() {
  const { authLoading, isLoggedIn } = useAuth();

  if (authLoading) {
    return (
      <Loading
        size="fullscreen"
        message="Setting up your secure connection..."
      />
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth-google" replace />;
  }

  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
}

export default App;
