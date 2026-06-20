import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Projects() {

  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();   

  useEffect(() => {

    axios
      .get("http://localhost:5000/projects", {
        params: {
          search,
          year,
          status
        }
      })
      .then((response) => {
        setProjects(response.data.data);
      })
      .catch(console.error);

  }, [search, year, status]);

  return (
    <div style={{ padding: "20px" }}>

      <h2>Projects</h2>

      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px"
      }}>

        <input
          type="text"
          placeholder="Search Project"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="text"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>

      </div>

      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Project Name</th>
            <th>Year</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {projects.map((project) => (
            <tr key={project.project_id}>
              <td>{project.project_id}</td>
              <td>{project.project_name}</td>
              <td>{project.year}</td>
              <td>{project.classification_status}</td>
              <td>
              <button
                  onClick={() =>
                    navigate(`/project/${project.project_id}`)
                  }
                >
              Open
            </button>
              </td>
            </tr>
          ))}

        </tbody>
      </table>

    </div>
  );
}