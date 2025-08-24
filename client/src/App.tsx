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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth-google" element={<AuthPage />} />

          <Route element={<ProtectedLayout />}>
            <Route
              path="/"
              element={
                <UserDetailsProvider>
                  <Dashboard />
                </UserDetailsProvider>
              }
            />
            <Route
              path="u/:receiver_id"
              element={
                <UserDetailsProvider>
                  <Dashboard />
                </UserDetailsProvider>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function ProtectedLayout() {
  const { authLoading, isLoggedIn } = useAuth();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth-google" replace />;
  }

  return <Outlet />;
}

export default App;
