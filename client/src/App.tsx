import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import SignInPage from "./components/SignInPage";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth-google" element={<SignInPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function ProtectedLayout() {
  const { isLoggedIn, authLoading } = useAuth();
  if (authLoading) return <div> Loading.... </div>;
  return isLoggedIn ? <Outlet /> : <Navigate to="/auth-google" replace />;
}

export default App;
