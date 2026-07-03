import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { ColorModeProvider } from "./ThemeContext";

function App() {
  return (
    <ColorModeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/add" element={<AddProject />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/classify-projects" element={<ClassifyProjects />} />
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/finance/entry" element={<FinanceEntry />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ColorModeProvider>
  );
}

export default App;