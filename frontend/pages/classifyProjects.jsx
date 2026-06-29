import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Divider
} from "@mui/material";

export default function ClassifyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/projects", {
        params: { status: "Pending" }
      }
      );
      setProjects(response.data.data || response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress size={45} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 1, minWidth: 0, width: "100%", overflowX: "hidden" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "text.primary", mb: 1 }}>
          Project Classification Queue
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          These projects are pending manual classification. Select "Classify" to categorize them by primary theme, sub-themes, target groups, and activities.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#e11d48" }}>
          Pending Classifications: {projects.length}
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Project Name</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Financial Year</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#475569", textAlign: "center" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="subtitle1" sx={{ color: "#10b981", fontWeight: "bold" }}>
                    🎉 All projects are classified! The queue is empty.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.project_id} hover>
                  <TableCell>{project.project_id}</TableCell>
                  <TableCell sx={{ fontWeight: "600", color: "#1e293b", maxWidth: "400px" }}>
                    {project.project_name}
                  </TableCell>
                  <TableCell>{project.year || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label="Pending"
                      color="warning"
                      size="small"
                      sx={{ fontWeight: "bold", px: 1 }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Button
                      component={Link}
                      to={`/project/${project.project_id}`}
                      variant="contained"
                      size="small"
                      sx={{
                        backgroundColor: "#3b82f6",
                        "&:hover": { backgroundColor: "#2563eb" },
                        textTransform: "none",
                        fontWeight: "bold"
                      }}
                    >
                      Classify
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}