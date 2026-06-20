import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/dashboard";
import Projects from "./pages/projects";
import ProjectDetails from "./pages/ProjectDetails";
import ClassifyProjects from "./pages/classifyProjects";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
            <>
              <Dashboard />
              <Projects />
            </>
          }
        />

        <Route
          path="/project/:id"
          element={<ProjectDetails />}
        />

        <Route
          path="/classify-projects"
          element={<ClassifyProjects />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;