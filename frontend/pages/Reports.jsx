import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Stack
} from "@mui/material";
import {
  Download as DownloadIcon,
  FilterList as FilterIcon
} from "@mui/icons-material";

export default function Reports() {
  const [projects, setProjects] = useState([]);
  const [themes, setThemes] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [years, setYears] = useState([]);

  // Filter selections
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedYear, selectedTheme, selectedAgency, selectedStatus]);

  const loadFilters = async () => {
    try {
      const [themesRes, agenciesRes, projectsRes] = await Promise.all([
        axios.get("http://localhost:5000/themes"),
        axios.get("http://localhost:5000/agencies"),
        axios.get("http://localhost:5000/projects")
      ]);

      setThemes(themesRes.data.data || themesRes.data);
      setAgencies(agenciesRes.data);
      
      const allProjects = projectsRes.data.data || projectsRes.data;
      const uniqueYears = [...new Set(allProjects.map(p => p.year))].filter(Boolean).sort().reverse();
      setYears(uniqueYears);
    } catch (err) {
      console.error("Error loading filter options:", err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/reports", {
        params: {
          year: selectedYear,
          theme_id: selectedTheme,
          agency_id: selectedAgency,
          status: selectedStatus
        }
      });
      setProjects(res.data.data);
    } catch (err) {
      console.error("Error loading report projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const getExportUrl = (format) => {
    const params = new URLSearchParams();
    if (selectedYear) params.append("year", selectedYear);
    if (selectedTheme) params.append("theme_id", selectedTheme);
    if (selectedAgency) params.append("agency_id", selectedAgency);
    if (selectedStatus) params.append("status", selectedStatus);
    
    return `http://localhost:5000/reports/export/${format}?${params.toString()}`;
  };

  const handleExport = (format) => {
    const url = getExportUrl(format);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `projects_report.${format === 'excel' ? 'xlsx' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}>
          Reports & Data Export
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Query, filter, and extract NGO datasets into Excel spreadsheets or CSV formats.
        </Typography>
      </Box>

      {/* Filters Form Container */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#334155", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon fontSize="small" /> Filter Datasets
        </Typography>
        <Grid container spacing={2}>
          {/* Year Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>All Years</InputLabel>
              <Select
                value={selectedYear}
                label="All Years"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="">All Years</MenuItem>
                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Theme Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>All Primary Themes</InputLabel>
              <Select
                value={selectedTheme}
                label="All Primary Themes"
                onChange={(e) => setSelectedTheme(e.target.value)}
              >
                <MenuItem value="">All Themes</MenuItem>
                {themes.map(t => <MenuItem key={t.theme_id} value={t.theme_id}>{t.theme_name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Agency Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>All Agencies</InputLabel>
              <Select
                value={selectedAgency}
                label="All Agencies"
                onChange={(e) => setSelectedAgency(e.target.value)}
              >
                <MenuItem value="">All Agencies</MenuItem>
                {agencies.map(a => <MenuItem key={a.agency_id} value={a.agency_id}>{a.agency_name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Classification Status */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>All Statuses</InputLabel>
              <Select
                value={selectedStatus}
                label="All Statuses"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Action panel */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: "center" }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport("excel")}
          disabled={projects.length === 0}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          Export Excel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport("csv")}
          disabled={projects.length === 0}
          sx={{ textTransform: "none", fontWeight: "bold", backgroundColor: "#2563eb", "&:hover": { backgroundColor: "#1d4ed8" } }}
        >
          Export CSV
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#64748b" }}>
          Total projects matched: {projects.length}
        </Typography>
      </Stack>

      {/* Table section */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
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
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Primary Theme</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>
                    No project records match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((p) => (
                  <TableRow key={p.project_id} hover>
                    <TableCell>{p.project_id}</TableCell>
                    <TableCell sx={{ fontWeight: "600", color: "#1e293b", maxWidth: "300px" }}>{p.project_name}</TableCell>
                    <TableCell>{p.year || "-"}</TableCell>
                    <TableCell>{p.agency_name || "-"}</TableCell>
                    <TableCell>{p.state || "-"}</TableCell>
                    <TableCell sx={{ color: "#0f766e", fontWeight: p.primary_theme ? "600" : "normal" }}>
                      {p.primary_theme || "Unclassified"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.classification_status}
                        color={p.classification_status === "Completed" ? "success" : "warning"}
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
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
