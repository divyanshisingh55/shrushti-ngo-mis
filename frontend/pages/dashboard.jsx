import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {

  const [summary, setSummary] = useState({
    totalProjects: 0,
    pendingProjects: 0,
    completedProjects: 0
  });

  useEffect(() => {

    axios
      .get("http://localhost:5000/dashboard/summary")
      .then((response) => {
        setSummary(response.data);
      })
      .catch(console.error);

  }, []);

  return (
    <div style={{ padding: "30px" }}>

      <h1>Shrushti MIS Dashboard</h1>

      <div style={{
        display: "flex",
        gap: "20px",
        marginTop: "30px"
      }}>

        <div>
          <h2>Total Projects</h2>
          <h1>{summary.totalProjects}</h1>
        </div>

        <div>
          <h2>Pending</h2>
          <h1>{summary.pendingProjects}</h1>
        </div>

        <div>
          <h2>Completed</h2>
          <h1>{summary.completedProjects}</h1>
        </div>

      </div>

    </div>
  );
}