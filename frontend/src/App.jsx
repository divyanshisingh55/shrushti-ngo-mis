import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import Dashboard from "../pages/dashboard";
import Projects from "../pages/projects";
import ProjectDetails from "../pages/ProjectDetails";
import ClassifyProjects from "../pages/classifyProjects";
import AddProject from "../pages/AddProject";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/add" element={<AddProject />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/classify-projects" element={<ClassifyProjects />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;