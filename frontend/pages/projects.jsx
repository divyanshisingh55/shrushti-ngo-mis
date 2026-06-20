import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Paper,
  Chip,
  IconButton,
  CircularProgress
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from "@mui/icons-material";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();   

  useEffect(() => {
    fetchProjects();
  }, [search, year, status]);

  const fetchProjects = () => {
    setLoading(true);
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
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the project: "${name}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`http://localhost:5000/projects/${id}`);
        alert("Project deleted successfully");
        fetchProjects();
      } catch (error) {
        console.error("Delete Error:", error);
        alert(error.response?.data?.message || "Failed to delete project");
      }
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      
      {/* Header section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}>
            NGO Projects
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b" }}>
            Manage, classify, and track historical and newly added NGO projects.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/projects/add")}
          sx={{
            backgroundColor: "#3b82f6",
            "&:hover": { backgroundColor: "#2563eb" },
            textTransform: "none",
            fontWeight: "bold",
            borderRadius: "8px",
            px: 2,
            py: 1
          }}
        >
          Add New Project
        </Button>
      </Box>

      {/* Filters section */}
      <Box sx={{ 
        display: "flex", 
        gap: 2, 
        mb: 3, 
        flexWrap: "wrap",
        backgroundColor: "white",
        p: 2,
        borderRadius: "8px",
        border: "1px solid #e2e8f0"
      }}>
        <TextField
          label="Search Project Name"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: "1 1 250px" }}
        />

        <TextField
          label="Filter by Year"
          variant="outlined"
          size="small"
          placeholder="e.g. 2024-25"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          sx={{ flex: "1 1 150px" }}
        />

        <FormControl size="small" sx={{ flex: "1 1 200px" }}>
          <InputLabel>Classification Status</InputLabel>
          <Select
            value={status}
            label="Classification Status"
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table section */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Project Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Year</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Agency</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>State</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Classification Status</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569", textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>
                    No projects found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.project_id} hover>
                    <TableCell>{project.project_id}</TableCell>
                    <TableCell sx={{ fontWeight: "600", color: "#1e293b", maxWidth: "300px" }}>
                      {project.project_name}
                    </TableCell>
                    <TableCell>{project.year || "-"}</TableCell>
                    <TableCell>{project.agency_name || "-"}</TableCell>
                    <TableCell>{project.state_name || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={project.classification_status}
                        color={project.classification_status === "Completed" ? "success" : "warning"}
                        size="small"
                        sx={{ fontWeight: "bold", px: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => navigate(`/project/${project.project_id}`)}
                          sx={{ textTransform: "none", fontWeight: "bold" }}
                        >
                          View & Classify
                        </Button>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(project.project_id, project.project_name)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}