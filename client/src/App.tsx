import {
  Route,
  Navigate,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardRedirect />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function DashboardRedirect() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : <Home />;
}

export default App;
