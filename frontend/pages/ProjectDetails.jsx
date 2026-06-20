import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ProjectDetails() {
  const { id } = useParams();

  const [project, setProject] = useState(null);

  const [themes, setThemes] = useState([]);
  const [subThemes, setSubThemes] = useState([]);
  const [targetGroups, setTargetGroups] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);

  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedSubTheme, setSelectedSubTheme] = useState("");
  const [selectedTargetGroup, setSelectedTargetGroup] = useState("");
  const [selectedActivityType, setSelectedActivityType] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const projectRes = await axios.get(
        `http://localhost:5000/project/${id}`
      );

      setProject(projectRes.data);

      const themesRes = await axios.get(
        "http://localhost:5000/themes"
      );

      setThemes(themesRes.data.data || themesRes.data);

      const subThemesRes = await axios.get(
        "http://localhost:5000/subthemes"
      );

      setSubThemes(subThemesRes.data);

      const targetGroupsRes = await axios.get(
        "http://localhost:5000/targetgroups"
      );

      setTargetGroups(targetGroupsRes.data);

      const activityTypesRes = await axios.get(
        "http://localhost:5000/activitytypes"
      );

      setActivityTypes(activityTypesRes.data);

    } catch (error) {
      console.error(error);
    }
  };

  const saveClassification = async () => {
    try {
      if (
        !selectedTheme ||
        !selectedSubTheme ||
        !selectedTargetGroup ||
        !selectedActivityType
      ) {
        alert("Please select all fields");
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/classify-project/${id}`,
        {
          themeId: Number(selectedTheme),
          subThemeId: Number(selectedSubTheme),
          activityTypeId: Number(selectedActivityType),
          targetGroupId: Number(selectedTargetGroup)
        }
      );

      alert(response.data.message);

      const updatedProject = await axios.get(
        `http://localhost:5000/project/${id}`
      );

      setProject(updatedProject.data);

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        error.message
      );
    }
  };

  if (!project) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "900px",
        margin: "0 auto"
      }}
    >
      <h1>Project Details</h1>

      <h2>{project.project_name}</h2>

      <p>
        <strong>Year:</strong> {project.year}
      </p>

      <p>
        <strong>Doc No:</strong> {project.doc_no}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        {project.classification_status}
      </p>

      <hr />

      <h3>Major Theme</h3>

      <select
        value={selectedTheme}
        onChange={(e) =>
          setSelectedTheme(e.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px"
        }}
      >
        <option value="">Select Theme</option>

        {themes.map((theme) => (
          <option
            key={theme.theme_id}
            value={theme.theme_id}
          >
            {theme.theme_name}
          </option>
        ))}
      </select>

      <h3>Sub Theme</h3>

      <select
        value={selectedSubTheme}
        onChange={(e) =>
          setSelectedSubTheme(e.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px"
        }}
      >
        <option value="">Select Sub Theme</option>

        {subThemes.map((subTheme) => (
          <option
            key={subTheme.sub_theme_id}
            value={subTheme.sub_theme_id}
          >
            {subTheme.sub_theme_name}
          </option>
        ))}
      </select>

      <h3>Target Group</h3>

      <select
        value={selectedTargetGroup}
        onChange={(e) =>
          setSelectedTargetGroup(e.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px"
        }}
      >
        <option value="">Select Target Group</option>

        {targetGroups.map((group) => (
          <option
            key={group.target_group_id}
            value={group.target_group_id}
          >
            {group.main_group} - {group.sub_group}
          </option>
        ))}
      </select>

      <h3>Activity Type</h3>

      <select
        value={selectedActivityType}
        onChange={(e) =>
          setSelectedActivityType(e.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "20px"
        }}
      >
        <option value="">Select Activity Type</option>

        {activityTypes.map((activity) => (
          <option
            key={activity.activity_type_id}
            value={activity.activity_type_id}
          >
            {activity.activity_type_name}
          </option>
        ))}
      </select>

      <button
        onClick={saveClassification}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          cursor: "pointer"
        }}
      >
        Save Classification
      </button>
    </div>
  );
}