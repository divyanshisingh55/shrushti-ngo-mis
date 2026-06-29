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
  Stack,
  Checkbox
} from "@mui/material";
import {
  Download as DownloadIcon,
  FilterList as FilterIcon,
  PictureAsPdf as PdfIcon
} from "@mui/icons-material";

export default function Reports() {
  const [projects, setProjects] = useState([]);
  const [themes, setThemes] = useState([]);
  const [subThemes, setSubThemes] = useState([]);
  const [targetGroups, setTargetGroups] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filter selections
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedSubTheme, setSelectedSubTheme] = useState("");
  const [selectedTargetGroup, setSelectedTargetGroup] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilters();
  }, []);

  // Fetch data on filter change
  useEffect(() => {
    fetchReportData();
  }, [
    selectedYear,
    selectedTheme,
    selectedSubTheme,
    selectedTargetGroup,
    selectedState,
    selectedDistrict,
    selectedAgency,
    selectedStatus
  ]);

  // Handle dynamic district cascade
  useEffect(() => {
    if (selectedState) {
      axios.get(`http://localhost:5000/districts?state_id=${selectedState}`)
        .then(res => setDistricts(res.data))
        .catch(err => console.error(err));
    } else {
      setDistricts([]);
    }
    setSelectedDistrict("");
  }, [selectedState]);

  const loadFilters = async () => {
    try {
      const [themesRes, subThemesRes, targetGroupsRes, statesRes, agenciesRes, projectsRes] = await Promise.all([
        axios.get("http://localhost:5000/themes"),
        axios.get("http://localhost:5000/subthemes"),
        axios.get("http://localhost:5000/targetgroups"),
        axios.get("http://localhost:5000/states"),
        axios.get("http://localhost:5000/agencies"),
        axios.get("http://localhost:5000/projects")
      ]);

      setThemes(themesRes.data.data || themesRes.data);
      setSubThemes(subThemesRes.data);
      setTargetGroups(targetGroupsRes.data);
      setStates(statesRes.data);
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
    setSelectedIds([]);
    try {
      const res = await axios.get("http://localhost:5000/reports", {
        params: {
          year: selectedYear,
          theme_id: selectedTheme,
          sub_theme_id: selectedSubTheme,
          target_group_id: selectedTargetGroup,
          state_id: selectedState,
          district_id: selectedDistrict,
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
    if (selectedIds.length > 0) {
      params.append("project_ids", selectedIds.join(","));
    } else {
      if (selectedYear) params.append("year", selectedYear);
      if (selectedTheme) params.append("theme_id", selectedTheme);
      if (selectedSubTheme) params.append("sub_theme_id", selectedSubTheme);
      if (selectedTargetGroup) params.append("target_group_id", selectedTargetGroup);
      if (selectedState) params.append("state_id", selectedState);
      if (selectedDistrict) params.append("district_id", selectedDistrict);
      if (selectedAgency) params.append("agency_id", selectedAgency);
      if (selectedStatus) params.append("status", selectedStatus);
    }
    return `http://localhost:5000/reports/export/${format}?${params.toString()}`;
  };

  const handleExport = (format) => {
    const url = getExportUrl(format);
    window.open(url, "_blank");
  };

  const handlePrintPdf = () => {
    const url = getExportUrl("pdf");
    window.open(url, "_blank");
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(projects.map(p => p.project_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 1, minWidth: 0, width: "100%", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* Hide drawer navigation, app bars, query forms, and other buttons */
          .MuiDrawer-root, .MuiAppBar-root, #reports-header, #reports-filters, #reports-actions, .no-print {
            display: none !important;
          }
          /* Eliminate sidebar offsets and spacing on print canvas */
          main, .MuiBox-root, #root {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          /* Simple border rules for printed report grids */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #999 !important;
            padding: 6px !important;
            font-size: 10px !important;
            color: #000 !important;
          }
          th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />

      <Box id="reports-header" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "text.primary", mb: 1 }}>
          Reports & Data Export
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Query, filter, and extract NGO datasets into Excel spreadsheets, CSV formats, or print PDF.
        </Typography>
      </Box>

      {/* Filters Form Container */}
      <Paper id="reports-filters" sx={{ p: 3, mb: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#334155", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon fontSize="small" /> Filter Datasets
        </Typography>
        <Grid container spacing={2}>
          {/* Year Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

          {/* Agency Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>All Donor Agencies</InputLabel>
              <Select
                value={selectedAgency}
                label="All Donor Agencies"
                onChange={(e) => setSelectedAgency(e.target.value)}
              >
                <MenuItem value="">All Donor Agencies</MenuItem>
                {agencies.map(a => <MenuItem key={a.agency_id} value={a.agency_id}>{a.agency_name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Theme Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>All Themes</InputLabel>
              <Select
                value={selectedTheme}
                label="All Themes"
                onChange={(e) => { setSelectedTheme(e.target.value); setSelectedSubTheme(""); }}
              >
                <MenuItem value="">All Themes</MenuItem>
                {themes.map(t => <MenuItem key={t.theme_id} value={t.theme_id}>{t.theme_name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Sub Theme Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small" disabled={!selectedTheme}>
              <InputLabel>All Sub Themes</InputLabel>
              <Select
                value={selectedSubTheme}
                label="All Sub Themes"
                onChange={(e) => setSelectedSubTheme(e.target.value)}
              >
                <MenuItem value="">All Sub Themes</MenuItem>
                {subThemes.filter(st => st.theme_id === Number(selectedTheme)).map(st => (
                  <MenuItem key={st.sub_theme_id} value={st.sub_theme_id}>{st.sub_theme_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Target Group Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>All Target Groups</InputLabel>
              <Select
                value={selectedTargetGroup}
                label="All Target Groups"
                onChange={(e) => setSelectedTargetGroup(e.target.value)}
              >
                <MenuItem value="">All Target Groups</MenuItem>
                {targetGroups.map(tg => (
                  <MenuItem key={tg.target_group_id} value={tg.target_group_id}>{tg.main_group} - {tg.sub_group}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* State Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>All States</InputLabel>
              <Select
                value={selectedState}
                label="All States"
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <MenuItem value="">All States</MenuItem>
                {states.map(s => <MenuItem key={s.state_id} value={s.state_id}>{s.state_name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* District Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small" disabled={!selectedState}>
              <InputLabel>All Districts</InputLabel>
              <Select
                value={selectedDistrict}
                label="All Districts"
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <MenuItem value="">All Districts</MenuItem>
                {districts.map(d => <MenuItem key={d.district_id} value={d.district_id}>{d.district_name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Classification Status */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Classification Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Classification Status"
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
      <Stack id="reports-actions" direction="row" spacing={2} sx={{ mb: 3, alignItems: "center" }}>
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
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PdfIcon />}
          onClick={handlePrintPdf}
          disabled={projects.length === 0}
          sx={{ textTransform: "none", fontWeight: "bold", backgroundColor: "#8b5cf6", "&:hover": { backgroundColor: "#7c3aed" } }}
        >
          Export PDF / Print
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "text.secondary" }}>
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
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={projects.length > 0 && selectedIds.length === projects.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < projects.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Project Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Year</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Donor Agency</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>State</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Primary Theme</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>Classification Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>
                    No project records match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((p) => (
                  <TableRow key={p.project_id} hover selected={selectedIds.includes(p.project_id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(p.project_id)}
                        onChange={() => handleSelectOne(p.project_id)}
                      />
                    </TableCell>
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
