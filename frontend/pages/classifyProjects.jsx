import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function ClassifyProjects() {

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {

      const response = await axios.get(
        "http://localhost:5000/projects"
      );

      setProjects(
        response.data.data || response.data
      );

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  };

  if (loading) {
    return <h2>Loading Projects...</h2>;
  }

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1400px",
        margin: "0 auto"
      }}
    >
      <h1>Project Classification</h1>

      <p>
        Total Projects: {projects.length}
      </p>

      <table
        border="1"
        cellPadding="10"
        cellSpacing="0"
        width="100%"
      >
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

              <td>
                {project.project_id}
              </td>

              <td>
                {project.project_name}
              </td>

              <td>
                {project.year}
              </td>

              <td>

                {project.classification_status === "Completed"
                  ? "✅ Completed"
                  : "⏳ Pending"}

              </td>

              <td>

                <Link
                  to={`/project/${project.project_id}`}
                >
                  <button>
                    Classify
                  </button>
                </Link>

              </td>

            </tr>

          ))}

        </tbody>
      </table>
    </div>
  );
}