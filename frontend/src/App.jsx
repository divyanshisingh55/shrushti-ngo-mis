import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import Dashboard from "../pages/dashboard";
import Projects from "../pages/projects";
import ProjectDetails from "../pages/ProjectDetails";
import ClassifyProjects from "../pages/classifyProjects";
import AddProject from "../pages/AddProject";
import FinanceDashboard from "../pages/FinanceDashboard";
import FinanceEntry from "../pages/FinanceEntry";
import UserProfile from "../pages/UserProfile";
import AdminDashboard from "../pages/AdminDashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import { ColorModeProvider } from "./ThemeContext";

// Guard: must be logged in
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// Guard: must be Admin or Founder
function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!token) return <Navigate to="/login" replace />;
  if (!user || (user.role !== "Admin" && user.role !== "Founder")) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <ColorModeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes — no Layout wrapper */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Redirect root to dashboard (which will redirect to login if not authed) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected portal routes — inside Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/add" element={<AddProject />} />
                    <Route path="/project/:id" element={<ProjectDetails />} />
                    <Route path="/classify-projects" element={<ClassifyProjects />} />
                    <Route path="/finance" element={<FinanceDashboard />} />
                    <Route path="/finance/entry" element={<FinanceEntry />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ColorModeProvider>
  );
}

export default App;