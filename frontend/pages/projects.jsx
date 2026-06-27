import { useEffect, useState, Fragment } from "react";
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
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Divider,
  Autocomplete
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  FileCopy as DuplicateIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  SmartToy as AiIcon,
  Download as DownloadIcon
} from "@mui/icons-material";

const TARGET_GROUPS_MAPPING = {
  "Children": [
    "ECCE children",
    "primary school children",
    "upper primary children",
    "secondary students",
    "out-of-school children",
    "child labour-affected children"
  ],
  "Girls": [
    "Adolescent girls",
    "school-going girls",
    "drop-out girls",
    "young women"
  ],
  "Boys": [
    "School-going boys",
    "adolescent boys",
    "youth boys"
  ],
  "Women": [
    "SHG members",
    "pregnant women",
    "lactating mothers",
    "farm women",
    "women entrepreneurs",
    "widows",
    "single women"
  ],
  "Men": [
    "Farmers",
    "skilled workers",
    "community volunteers",
    "fathers",
    "male youth"
  ],
  "Youth": [
    "College youth",
    "unemployed youth",
    "rural youth",
    "urban youth",
    "NEET youth"
  ],
  "Farmers": [
    "Small farmers",
    "marginal farmers",
    "women farmers",
    "tenant farmers",
    "tribal farmers"
  ],
  "Elderly": [
    "Senior citizens",
    "bedridden elderly",
    "single elderly"
  ],
  "Persons with disabilities": [
    "Children with disabilities",
    "adults with disabilities"
  ],
  "Community groups": [
    "SHGs",
    "CBOs",
    "PRI members",
    "teachers",
    "anganwadi workers",
    "ASHAs",
    "peer educators"
  ]
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Selected Projects for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  // --- FILTER STATES ---
  const [search, setSearch] = useState("");
  const [docNo, setDocNo] = useState("");
  const [year, setYear] = useState("");
  const [agencyIds, setAgencyIds] = useState([]);
  const [fundingSourceId, setFundingSourceId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [statusId, setStatusId] = useState(""); // implementation status
  const [themeId, setThemeId] = useState("");
  const [subThemeId, setSubThemeId] = useState("");
  const [activityTypeId, setActivityTypeId] = useState("");
  const [sdgId, setSdgId] = useState("");
  const [targetGroupFilters, setTargetGroupFilters] = useState([{ mainGroup: "", subGroups: [] }]);
  const [minAmount, setMinAmount] = useState("");
  const [approvalDateStart, setApprovalDateStart] = useState("");
  const [approvalDateEnd, setApprovalDateEnd] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [fundingSource2, setFundingSource2] = useState("");

  // --- DEBOUNCED STATES FOR TEXT INPUTS ---
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedDocNo, setDebouncedDocNo] = useState("");
  const [debouncedYear, setDebouncedYear] = useState("");
  const [debouncedMinAmount, setDebouncedMinAmount] = useState("");

  // --- METADATA LISTS ---
  const [agencies, setAgencies] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [themes, setThemes] = useState([]);
  const [subThemes, setSubThemes] = useState([]);
  const [targetGroups, setTargetGroups] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [sdgs, setSdgs] = useState([]);

  // --- FILTER PRESETS ---
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState({});
  const [selectedPreset, setSelectedPreset] = useState("");

  // --- BULK AI CLASSIFY DIALOG ---
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSuggestions, setBulkSuggestions] = useState([]);

  useEffect(() => {
    fetchMetadata();
    loadPresets();
  }, []);

  // Debounce typing inputs to optimize API load and eliminate lag
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedDocNo(docNo);
      setDebouncedYear(year);
      setDebouncedMinAmount(minAmount);
    }, 350);

    return () => clearTimeout(handler);
  }, [search, docNo, year, minAmount]);

  // Trigger reload on filter values change
  useEffect(() => {
    fetchProjects();
  }, [
    debouncedSearch, debouncedDocNo, debouncedYear, agencyIds, fundingSourceId, stateId,
    districtId, blockId, statusId, themeId, subThemeId,
    activityTypeId, sdgId, JSON.stringify(targetGroupFilters), debouncedMinAmount,
    approvalDateStart, approvalDateEnd, fundingSource, fundingSource2
  ]);

  // Handle dynamic district/block cascade
  useEffect(() => {
    if (stateId) {
      axios.get(`http://localhost:5000/districts?state_id=${stateId}`)
        .then(res => setDistricts(res.data))
        .catch(err => console.error(err));
    } else {
      setDistricts([]);
      setBlocks([]);
    }
    setDistrictId("");
    setBlockId("");
  }, [stateId]);

  useEffect(() => {
    if (districtId) {
      axios.get(`http://localhost:5000/blocks?district_id=${districtId}`)
        .then(res => setBlocks(res.data))
        .catch(err => console.error(err));
    } else {
      setBlocks([]);
    }
    setBlockId("");
  }, [districtId]);

  const fetchMetadata = async () => {
    try {
      const [agenciesRes, fundingRes, statesRes, statusesRes, themesRes, subThemesRes, targetGroupsRes, activityTypesRes, sdgsRes] = await Promise.all([
        axios.get("http://localhost:5000/agencies"),
        axios.get("http://localhost:5000/fundingsources"),
        axios.get("http://localhost:5000/states"),
        axios.get("http://localhost:5000/statuses"),
        axios.get("http://localhost:5000/themes"),
        axios.get("http://localhost:5000/subthemes"),
        axios.get("http://localhost:5000/targetgroups"),
        axios.get("http://localhost:5000/activitytypes"),
        axios.get("http://localhost:5000/sdgs")
      ]);

      setAgencies(agenciesRes.data);
      setFundingSources(fundingRes.data);
      setStates(statesRes.data);
      setStatuses(statusesRes.data);
      setThemes(themesRes.data.data || themesRes.data);
      setSubThemes(subThemesRes.data);
      setTargetGroups(targetGroupsRes.data);
      setActivityTypes(activityTypesRes.data);
      setSdgs(sdgsRes.data);
    } catch (err) {
      console.error("Error loading dropdown data:", err);
    }
  };

  const fetchProjects = () => {
    setLoading(true);
    const activeTargetGroupFilters = targetGroupFilters.filter(f => f.mainGroup);
    const params = {
      search: debouncedSearch,
      doc_no: debouncedDocNo,
      year: debouncedYear,
      agency_id: agencyIds.join(","),
      funding_source_id: fundingSourceId,
      funding_source: fundingSource,
      funding_source2: fundingSource2,
      state_id: stateId,
      district_id: districtId,
      block_id: blockId,
      status_id: statusId,
      theme_id: themeId,
      sub_theme_id: subThemeId,
      activity_type_id: activityTypeId,
      sdg_id: sdgId,
      target_group_filters: activeTargetGroupFilters.length > 0 ? JSON.stringify(activeTargetGroupFilters) : undefined,
      min_amount: debouncedMinAmount,
      approval_date_start: approvalDateStart,
      approval_date_end: approvalDateEnd,
      is_archived: false
    };

    axios.get("http://localhost:5000/projects", { params })
      .then((response) => {
        setProjects(response.data.data || response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // --- CRUD OPERATIONS ---
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

  const handleDuplicate = async (id) => {
    try {
      await axios.post(`http://localhost:5000/projects/${id}/duplicate`);
      alert("Project duplicated successfully!");
      fetchProjects();
    } catch (error) {
      console.error("Duplicate Error:", error);
      alert("Failed to duplicate project.");
    }
  };

  const handleArchiveToggle = async (id, archived) => {
    try {
      if (archived) {
        await axios.post(`http://localhost:5000/projects/${id}/unarchive`);
        alert("Project restored successfully!");
      } else {
        await axios.post(`http://localhost:5000/projects/${id}/archive`);
        alert("Project archived successfully!");
      }
      fetchProjects();
    } catch (error) {
      console.error("Archive Error:", error);
      alert("Failed to change archive status.");
    }
  };

  // --- FILTER PRESETS ---
  const loadPresets = () => {
    const saved = localStorage.getItem("shrushti_filter_presets");
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      alert("Please enter a preset name");
      return;
    }
    const currentFilters = {
      search, docNo, year, agencyIds, fundingSourceId, stateId,
      districtId, blockId, statusId, themeId, subThemeId,
      activityTypeId, sdgId, targetGroupFilters, minAmount,
      approvalDateStart, approvalDateEnd, fundingSource, fundingSource2
    };

    const updatedPresets = { ...presets, [presetName]: currentFilters };
    setPresets(updatedPresets);
    localStorage.setItem("shrushti_filter_presets", JSON.stringify(updatedPresets));
    setPresetName("");
    alert(`Preset "${presetName}" saved!`);
  };

  const applyPreset = (name) => {
    setSelectedPreset(name);
    const filters = presets[name];
    if (filters) {
      setSearch(filters.search || "");
      setDocNo(filters.docNo || "");
      setYear(filters.year || "");
      setAgencyIds(filters.agencyIds || []);
      setFundingSourceId(filters.fundingSourceId || "");
      setStateId(filters.stateId || "");
      setDistrictId(filters.districtId || "");
      setBlockId(filters.blockId || "");
      setStatusId(filters.statusId || "");
      setThemeId(filters.themeId || "");
      setSubThemeId(filters.subThemeId || "");
      setActivityTypeId(filters.activityTypeId || "");
      setSdgId(filters.sdgId || "");
      setTargetGroupFilters(filters.targetGroupFilters || [{ mainGroup: "", subGroups: [] }]);
      setMinAmount(filters.minAmount || "");
      setApprovalDateStart(filters.approvalDateStart || "");
      setApprovalDateEnd(filters.approvalDateEnd || "");
      setFundingSource(filters.fundingSource || "");
      setFundingSource2(filters.fundingSource2 || "");
    }
  };

  const deletePreset = () => {
    if (!selectedPreset) {
      alert("No preset selected to delete");
      return;
    }
    if (window.confirm(`Are you sure you want to delete preset "${selectedPreset}"?`)) {
      const updatedPresets = { ...presets };
      delete updatedPresets[selectedPreset];
      setPresets(updatedPresets);
      localStorage.setItem("shrushti_filter_presets", JSON.stringify(updatedPresets));
      setSelectedPreset("");
      alert(`Preset deleted!`);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDocNo("");
    setYear("");
    setAgencyIds([]);
    setFundingSourceId("");
    setStateId("");
    setDistrictId("");
    setBlockId("");
    setStatusId("");
    setThemeId("");
    setSubThemeId("");
    setActivityTypeId("");
    setSdgId("");
    setTargetGroupFilters([{ mainGroup: "", subGroups: [] }]);
    setMinAmount("");
    setApprovalDateStart("");
    setApprovalDateEnd("");
    setFundingSource("");
    setFundingSource2("");
    setSelectedPreset("");
  };

  // --- CHECKBOX SELECTION ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(projects.map(p => p.project_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  // --- BULK AI CLASSIFY DIALOG PIPELINE ---
  const triggerBulkAiClassify = async () => {
    setBulkOpen(true);
    setBulkLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/ai-classify/bulk-suggest", {
        projectIds: selectedIds
      });
      setBulkSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error(err);
      alert("Failed to compile suggestions");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkChangeTheme = (index, value) => {
    const updated = [...bulkSuggestions];
    updated[index].suggestion.themeId = value;
    // reset subthemes
    updated[index].suggestion.subThemeIds = [];
    setBulkSuggestions(updated);
  };

  const handleBulkChangeSubThemes = (index, values) => {
    const updated = [...bulkSuggestions];
    updated[index].suggestion.subThemeIds = values;
    setBulkSuggestions(updated);
  };

  const saveBulkClassification = async () => {
    try {
      const payload = bulkSuggestions.map(x => ({
        projectId: x.projectId,
        themeId: x.suggestion.themeId,
        subThemeIds: x.suggestion.subThemeIds,
        targetGroupIds: x.suggestion.targetGroupIds,
        activityTypeIds: x.suggestion.activityTypeIds
      }));

      await axios.post("http://localhost:5000/ai-classify/bulk-save", {
        classifications: payload
      });

      alert("Bulk classifications saved successfully!");
      setBulkOpen(false);
      setSelectedIds([]);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert("Failed to save classifications.");
    }
  };

  const handleExport = (format) => {
    const params = new URLSearchParams();
    if (selectedIds.length > 0) {
      params.append("project_ids", selectedIds.join(","));
    } else {
      if (search) params.append("search", search);
      if (docNo) params.append("doc_no", docNo);
      if (year) params.append("year", year);
      if (agencyIds && agencyIds.length > 0) params.append("agency_id", agencyIds.join(","));
      if (fundingSourceId) params.append("funding_source_id", fundingSourceId);
      if (stateId) params.append("state_id", stateId);
      if (districtId) params.append("district_id", districtId);
      if (blockId) params.append("block_id", blockId);
      if (statusId) params.append("status_id", statusId);
      if (themeId) params.append("theme_id", themeId);
      if (subThemeId) params.append("sub_theme_id", subThemeId);
      if (activityTypeId) params.append("activity_type_id", activityTypeId);
      if (sdgId) params.append("sdg_id", sdgId);
      const activeTargetGroupFilters = targetGroupFilters.filter(f => f.mainGroup);
      if (activeTargetGroupFilters.length > 0) {
        params.append("target_group_filters", JSON.stringify(activeTargetGroupFilters));
      }
      if (minAmount) params.append("min_amount", minAmount);
      if (approvalDateStart) params.append("approval_date_start", approvalDateStart);
      if (approvalDateEnd) params.append("approval_date_end", approvalDateEnd);
      params.append("is_archived", "false");
    }

    const url = `http://localhost:5000/reports/export/${format}?${params.toString()}`;
    window.open(url, "_blank");
  };

  return (
    <Box sx={{ flexGrow: 1, p: 1, minWidth: 0, width: "100%", overflowX: "hidden" }}>

      {/* Header Panel */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#0f172a" }}>
              Shrushti Projects
            </Typography>
            <Chip
              label={`${projects.length} Projects`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: "bold", bgcolor: "#eff6ff", borderColor: "#bfdbfe" }}
            />
          </Box>
          <Typography variant="body1" sx={{ color: "#64748b" }}>
            Manage, duplicate, archive, and run AI-assisted bulk classification.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1 }}>
          {selectedIds.length > 0 && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AiIcon />}
              onClick={triggerBulkAiClassify}
              sx={{ textTransform: "none", fontWeight: "bold", borderRadius: "8px" }}
            >
              Bulk AI Classify ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport("excel")}
            disabled={projects.length === 0}
            sx={{ textTransform: "none", fontWeight: "bold", borderRadius: "8px" }}
          >
            Export Excel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport("csv")}
            disabled={projects.length === 0}
            sx={{
              backgroundColor: "#2563eb",
              "&:hover": { backgroundColor: "#1d4ed8" },
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "8px"
            }}
          >
            Export CSV
          </Button>
          {projects.length > 0 && projects.length < 10 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport("pdf")}
              sx={{
                backgroundColor: "#dc2626",
                "&:hover": { backgroundColor: "#b91c1c" },
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: "8px"
              }}
            >
              Export PDF
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
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
        </Stack>
      </Box>

      {/* Advanced Filters Accordion */}
      <Accordion sx={{ mb: 3, borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "none", "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: "#f8fafc", borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterIcon color="primary" fontSize="small" />
            <Typography sx={{ fontWeight: "bold", color: "#334155" }}>Advanced Filter System</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {/* Project Info Filters */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                multiple
                size="small"
                options={agencies}
                getOptionLabel={(option) => option.agency_name}
                value={agencies.filter(a => agencyIds.includes(a.agency_id))}
                onChange={(event, newValue) => {
                  setAgencyIds(newValue.map(v => v.agency_id));
                }}
                slotProps={{
                  paper: {
                    sx: {
                      width: "max-content",
                      minWidth: "100%",
                      maxWidth: 600
                    }
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Donor Agency" placeholder="Select..." />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Search Project Name" size="small" value={search} onChange={(e) => setSearch(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Doc Number" size="small" value={docNo} onChange={(e) => setDocNo(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Financial Year" size="small" value={year} placeholder="e.g. 2024-25" onChange={(e) => setYear(e.target.value)} />
            </Grid>

            {/* Classification Filters */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Theme</InputLabel>
                <Select value={themeId} label="Theme" onChange={(e) => { setThemeId(e.target.value); setSubThemeId(""); }}>
                  <MenuItem value="">All Themes</MenuItem>
                  {themes.map(t => <MenuItem key={t.theme_id} value={t.theme_id}>{t.theme_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small" disabled={!themeId}>
                <InputLabel>Sub Theme</InputLabel>
                <Select value={subThemeId} label="Sub Theme" onChange={(e) => setSubThemeId(e.target.value)}>
                  <MenuItem value="">All Sub Themes</MenuItem>
                  {subThemes.filter(st => st.theme_id === Number(themeId)).map(st => (
                    <MenuItem key={st.sub_theme_id} value={st.sub_theme_id}>{st.sub_theme_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Geographical Filters */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>State</InputLabel>
                <Select value={stateId} label="State" onChange={(e) => setStateId(e.target.value)}>
                  <MenuItem value="">All States</MenuItem>
                  {states.map(s => <MenuItem key={s.state_id} value={s.state_id}>{s.state_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small" disabled={!stateId}>
                <InputLabel>District</InputLabel>
                <Select value={districtId} label="District" onChange={(e) => setDistrictId(e.target.value)}>
                  <MenuItem value="">All Districts</MenuItem>
                  {districts.map(d => <MenuItem key={d.district_id} value={d.district_id}>{d.district_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small" disabled={!districtId}>
                <InputLabel>Block</InputLabel>
                <Select value={blockId} label="Block" onChange={(e) => setBlockId(e.target.value)}>
                  <MenuItem value="">All Blocks</MenuItem>
                  {blocks.map(b => <MenuItem key={b.block_id} value={b.block_id}>{b.block_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>SDG Goal</InputLabel>
                <Select value={sdgId} label="SDG Goal" onChange={(e) => setSdgId(e.target.value)}>
                  <MenuItem value="">All SDGs</MenuItem>
                  {sdgs.map(s => <MenuItem key={s.sdg_id} value={s.sdg_id}>{s.sdg_code} - {s.sdg_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Project Implementation Status</InputLabel>
                <Select value={statusId} label="Project Implementation Status" onChange={(e) => setStatusId(e.target.value)}>
                  <MenuItem value="">All Implementation Statuses</MenuItem>
                  {statuses.map(s => <MenuItem key={s.status_id} value={s.status_id}>{s.status_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Min Sanctioned Amount" type="number" size="small" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            </Grid>

            {/* Dynamic Target Group Filters Section (Full Width) */}
            <Grid size={12}>
              <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", mt: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#475569", mb: 2 }}>
                  Target Group Filters
                </Typography>
                <Stack spacing={2}>
                  {targetGroupFilters.map((filter, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                      <FormControl size="small" sx={{ minWidth: 220, flex: 1 }}>
                        <InputLabel>Main Target Group {targetGroupFilters.length > 1 ? `#${index + 1}` : ""}</InputLabel>
                        <Select
                          value={filter.mainGroup}
                          label={`Main Target Group ${targetGroupFilters.length > 1 ? `#${index + 1}` : ""}`}
                          onChange={(e) => {
                            const newFilters = [...targetGroupFilters];
                            newFilters[index].mainGroup = e.target.value;
                            newFilters[index].subGroups = [];
                            setTargetGroupFilters(newFilters);
                          }}
                        >
                          <MenuItem value="">All Main Groups</MenuItem>
                          {Object.keys(TARGET_GROUPS_MAPPING).map(g => (
                            <MenuItem key={g} value={g}>{g}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Autocomplete
                        multiple
                        size="small"
                        disabled={!filter.mainGroup}
                        options={filter.mainGroup ? TARGET_GROUPS_MAPPING[filter.mainGroup] : []}
                        getOptionLabel={(option) => option}
                        value={filter.subGroups}
                        onChange={(event, newValue) => {
                          const newFilters = [...targetGroupFilters];
                          newFilters[index].subGroups = newValue;
                          setTargetGroupFilters(newFilters);
                        }}
                        slotProps={{
                          paper: {
                            sx: {
                              width: "max-content",
                              minWidth: "100%",
                              maxWidth: 600
                            }
                          }
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="Sub-target groups" placeholder="Select..." />
                        )}
                        sx={{ minWidth: 280, flex: 2 }}
                      />

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "90px", minWidth: "90px", justifyContent: "flex-start" }}>
                        {index === targetGroupFilters.length - 1 && (
                          <IconButton
                            color="primary"
                            onClick={() => setTargetGroupFilters([...targetGroupFilters, { mainGroup: "", subGroups: [] }])}
                            title="Add target group filter"
                          >
                            <AddIcon />
                          </IconButton>
                        )}
                        {targetGroupFilters.length > 1 && (
                          <IconButton
                            color="error"
                            onClick={() => {
                              const newFilters = targetGroupFilters.filter((_, idx) => idx !== index);
                              setTargetGroupFilters(newFilters);
                            }}
                            title="Remove target group filter"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>

            {/* Source of Funding Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Source of Funding</InputLabel>
                <Select
                  value={fundingSource}
                  label="Source of Funding"
                  onChange={(e) => setFundingSource(e.target.value)}
                >
                  <MenuItem value="">All Sources</MenuItem>
                  <MenuItem value="Govt.">Govt.</MenuItem>
                  <MenuItem value="FCRA">FCRA</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                  <MenuItem value="CSR">CSR</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Source 2 Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Source 2</InputLabel>
                <Select
                  value={fundingSource2}
                  label="Source 2"
                  onChange={(e) => setFundingSource2(e.target.value)}
                >
                  <MenuItem value="">All Source 2 Options</MenuItem>
                  <MenuItem value="Institutional">Institutional</MenuItem>
                  <MenuItem value="GoR">GoR</MenuItem>
                  <MenuItem value="GoMP">GoMP</MenuItem>
                  <MenuItem value="GoI">GoI</MenuItem>
                  <MenuItem value="PSU">PSU</MenuItem>
                  <MenuItem value="District">District</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Presets and Actions Bar */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Save Active Preset Name"
                size="small"
                variant="outlined"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                sx={{ width: "200px" }}
              />
              <Button variant="outlined" color="success" size="small" startIcon={<SaveIcon />} onClick={savePreset}>
                Save Preset
              </Button>
              {Object.keys(presets).length > 0 && (
                <>
                  <FormControl size="small" sx={{ width: "200px" }}>
                    <InputLabel>Load Filter Preset</InputLabel>
                    <Select value={selectedPreset} label="Load Filter Preset" onChange={(e) => applyPreset(e.target.value)}>
                      <MenuItem value="">-- Load Preset --</MenuItem>
                      {Object.keys(presets).map(name => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedPreset && (
                    <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={deletePreset}>
                      Delete Preset
                    </Button>
                  )}
                </>
              )}
            </Box>
            <Button variant="outlined" color="inherit" size="small" startIcon={<ClearIcon />} onClick={clearFilters}>
              Clear Filters
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion >

      {/* Table section */}
      {/* Contextual floating action banner for bulk actions */}
      {
        selectedIds.length > 0 && (
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.1)"
            }}
          >
            <Typography variant="body1" sx={{ color: "#166534", fontWeight: "bold" }}>
              Selected {selectedIds.length} projects for bulk classification
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AiIcon />}
                onClick={triggerBulkAiClassify}
                sx={{ textTransform: "none", fontWeight: "bold", borderRadius: "20px" }}
              >
                Run Bulk AI Classification
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => setSelectedIds([])}
                sx={{ textTransform: "none", fontWeight: "bold", borderRadius: "20px" }}
              >
                Deselect All
              </Button>
            </Stack>
          </Paper>
        )
      }

      <Box sx={{ position: "relative", width: "100%" }}>
        {/* Loading Progress Bar at the top of the table to prevent layout shifts */}
        <Box sx={{ height: "4px", width: "100%", mb: 1 }}>
          {loading && <LinearProgress color="primary" />}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, px: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "600", color: "#334155", display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6" }}></span>
            Showing {projects.length} {projects.length === 1 ? "project" : "projects"} matching your filters
          </Typography>
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.05)",
            overflowX: "auto",
            maxHeight: "calc(100vh - 250px)",
            width: "100%",
            opacity: loading ? 0.6 : 1,
            transition: "opacity 0.2s ease-in-out",
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f5f9",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#cbd5e1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#94a3b8",
            }
          }}
        >
          <Table
            stickyHeader
            sx={{
              tableLayout: "fixed",
              minWidth: "5800px"
            }}
          >
            <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
              <TableRow sx={{ "& th": { borderBottom: "2px solid #cbd5e1", fontWeight: "bold", color: "#334155", backgroundColor: "#f1f5f9" } }}>
                <TableCell padding="checkbox" sx={{ width: "50px", backgroundColor: "#f1f5f9" }}>
                  <Checkbox
                    indeterminate={
                      selectedIds.length > 0 &&
                      selectedIds.length < projects.length
                    }
                    checked={
                      projects.length > 0 &&
                      selectedIds.length === projects.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>

                <TableCell sx={{ width: "80px", backgroundColor: "#f1f5f9" }}>Year</TableCell>
                <TableCell sx={{ width: "100px", backgroundColor: "#f1f5f9" }}>Doc. #</TableCell>
                <TableCell sx={{ width: "180px", backgroundColor: "#f1f5f9" }}>Donor Agency</TableCell>
                <TableCell sx={{ width: "300px", backgroundColor: "#f1f5f9" }}>Name of Project</TableCell>
                <TableCell sx={{ width: "130px", backgroundColor: "#f1f5f9" }}>Date of Approval</TableCell>
                <TableCell sx={{ width: "150px", backgroundColor: "#f1f5f9" }}>Sanctioned Amount (Rs.)</TableCell>
                <TableCell sx={{ width: "140px", backgroundColor: "#f1f5f9" }}>Status (Implementation)</TableCell>

                <TableCell sx={{ width: "150px", backgroundColor: "#f1f5f9" }}>Source of Funding</TableCell>
                <TableCell sx={{ width: "150px", backgroundColor: "#f1f5f9" }}>Funding Source 2</TableCell>
                <TableCell sx={{ width: "120px", backgroundColor: "#f1f5f9" }}>Funding Type</TableCell>
                <TableCell sx={{ width: "180px", backgroundColor: "#f1f5f9" }}>Donor Agency Name</TableCell>
                <TableCell sx={{ width: "150px", backgroundColor: "#f1f5f9" }}>Donor Category</TableCell>

                <TableCell sx={{ width: "120px", backgroundColor: "#f1f5f9" }}>State</TableCell>
                <TableCell sx={{ width: "120px", backgroundColor: "#f1f5f9" }}>District</TableCell>
                <TableCell sx={{ width: "150px", backgroundColor: "#f1f5f9" }}>Block/Village/ULB</TableCell>
                <TableCell sx={{ width: "100px", backgroundColor: "#f1f5f9" }}>Area Type</TableCell>
                <TableCell sx={{ width: "120px", backgroundColor: "#f1f5f9" }}>Rural Subtype</TableCell>
                <TableCell sx={{ width: "120px", backgroundColor: "#f1f5f9" }}>Urban Subtype</TableCell>
                <TableCell sx={{ width: "130px", backgroundColor: "#f1f5f9" }}>Settlement Detail</TableCell>
                <TableCell sx={{ width: "250px", backgroundColor: "#f1f5f9" }}>Geography Notes</TableCell>

                <TableCell sx={{ width: "180px", backgroundColor: "#f1f5f9" }}>Major Theme</TableCell>
                <TableCell sx={{ width: "250px", backgroundColor: "#f1f5f9" }}>Sub Theme</TableCell>
                <TableCell sx={{ width: "250px", backgroundColor: "#f1f5f9" }}>Activity Type</TableCell>

                <TableCell sx={{ width: "250px", backgroundColor: "#f1f5f9" }}>Target Group</TableCell>
                <TableCell sx={{ width: "150px", backgroundColor: "#f1f5f9" }}>Age Group</TableCell>
                <TableCell sx={{ width: "180px", backgroundColor: "#f1f5f9" }}>Gender Profile</TableCell>
                <TableCell sx={{ width: "180px", backgroundColor: "#f1f5f9" }}>Education Stage</TableCell>
                <TableCell sx={{ width: "200px", backgroundColor: "#f1f5f9" }}>Social Groups / Vulnerabilities</TableCell>

                <TableCell sx={{ width: "130px", backgroundColor: "#f1f5f9" }}>No. of Beneficiaries</TableCell>
                <TableCell sx={{ width: "130px", backgroundColor: "#f1f5f9" }}>Direct Beneficiaries</TableCell>
                <TableCell sx={{ width: "130px", backgroundColor: "#f1f5f9" }}>Indirect Beneficiaries</TableCell>
                <TableCell sx={{ width: "80px", backgroundColor: "#f1f5f9" }}>Male</TableCell>
                <TableCell sx={{ width: "80px", backgroundColor: "#f1f5f9" }}>Female</TableCell>
                <TableCell sx={{ width: "80px", backgroundColor: "#f1f5f9" }}>Boys</TableCell>
                <TableCell sx={{ width: "80px", backgroundColor: "#f1f5f9" }}>Girls</TableCell>

                <TableCell sx={{ width: "150px", backgroundColor: "#f1f5f9" }}>Classification Status</TableCell>
                <TableCell sx={{ width: "100px", backgroundColor: "#f1f5f9" }}>Duration (Months)</TableCell>
                <TableCell sx={{ width: "300px", backgroundColor: "#f1f5f9" }}>Outcome/Impact Notes</TableCell>
                <TableCell sx={{ width: "200px", backgroundColor: "#f1f5f9" }}>Remarks</TableCell>

                <TableCell
                  sx={{
                    width: "200px",
                    minWidth: "200px",
                    textAlign: "center",
                    backgroundColor: "#f1f5f9",
                    position: "sticky",
                    right: 0,
                    zIndex: 10
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={39} sx={{ textAlign: "center", py: 6, color: "#94a3b8" }}>
                    No projects found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => {
                  const isChecked = selectedIds.includes(project.project_id);
                  const isClassified = project.classification_status === "Completed";

                  let parsedCounts = [];
                  try {
                    if (project.beneficiary_counts) {
                      parsedCounts = JSON.parse(project.beneficiary_counts);
                    }
                  } catch (e) {
                    console.error("Error parsing beneficiary_counts", e);
                  }

                  const genders = Array.from(new Set(parsedCounts.map(c => c.gender))).filter(Boolean).join(", ");
                  const educations = Array.from(new Set(parsedCounts.map(c => c.educationStage))).filter(Boolean).join(", ");
                  const vulnerabilities = Array.from(new Set(parsedCounts.flatMap(c => c.vulnerabilities || []))).filter(Boolean).join(", ");

                  return (
                    <TableRow
                      key={project.project_id}
                      hover
                      checked={isChecked}
                      sx={{
                        "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                        "&:hover": { backgroundColor: "#f1f5f9 !important" },
                        transition: "background-color 0.2s"
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isChecked} onChange={(e) => handleSelectRow(e, project.project_id)} />
                      </TableCell>

                      {/* Basic details */}
                      <TableCell>{project.year || "-"}</TableCell>
                      <TableCell>{project.doc_no || "-"}</TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project.agency_name}>
                        {project.agency_name || "-"}
                      </TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: "#0f172a" }} title={project.project_name}>
                        {project.project_name}
                      </TableCell>
                      <TableCell>
                        {project.approval_date ? new Date(project.approval_date).toLocaleDateString("en-GB") : "-"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "bold", color: "#0f766e" }}>
                        {project.sanctioned_amount !== null && project.sanctioned_amount !== undefined
                          ? Number(project.sanctioned_amount).toLocaleString("en-IN")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {project.implementation_status ? (
                          <Chip
                            label={project.implementation_status}
                            color={project.implementation_status === "Completed" ? "success" : "primary"}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: "bold" }}
                          />
                        ) : "-"}
                      </TableCell>

                      {/* Funding details */}
                      <TableCell>{project.funding_source || "-"}</TableCell>
                      <TableCell>{project.funding_source2 || "-"}</TableCell>
                      <TableCell>{project.funding_type || "-"}</TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project.donor_agency_name}>
                        {project.donor_agency_name || "-"}
                      </TableCell>
                      <TableCell>{project.donor_category || "-"}</TableCell>

                      {/* Geography */}
                      <TableCell>{project.state_name || "-"}</TableCell>
                      <TableCell>{project.district || "-"}</TableCell>
                      <TableCell>{project.block_village_ulb || "-"}</TableCell>
                      <TableCell>{project.area_type || "-"}</TableCell>
                      <TableCell>{project.rural_subtype || "-"}</TableCell>
                      <TableCell>{project.urban_subtype || "-"}</TableCell>
                      <TableCell>{project.settlement_detail || "-"}</TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project.geography_notes}>
                        {project.geography_notes || "-"}
                      </TableCell>

                      {/* Theme classification */}
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project.theme1}>
                        {project.theme1 || "-"}
                      </TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project.sub_themes}>
                        {project.sub_themes || "-"}
                      </TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project.activity_types}>
                        {project.activity_types || "-"}
                      </TableCell>

                      {/* Beneficiary profile */}
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project.target_groups}>
                        {project.target_groups || "-"}
                      </TableCell>
                      <TableCell>{project.age_groups || "-"}</TableCell>
                      <TableCell>{genders || "-"}</TableCell>
                      <TableCell>{educations || "-"}</TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={vulnerabilities}>
                        {vulnerabilities || "-"}
                      </TableCell>

                      {/* Output scale */}
                      <TableCell>{project.total_beneficiaries !== null && project.total_beneficiaries !== undefined ? project.total_beneficiaries : "-"}</TableCell>
                      <TableCell>{project.direct_beneficiaries !== null && project.direct_beneficiaries !== undefined ? project.direct_beneficiaries : "-"}</TableCell>
                      <TableCell>{project.indirect_beneficiaries !== null && project.indirect_beneficiaries !== undefined ? project.indirect_beneficiaries : "-"}</TableCell>
                      <TableCell>{project.beneficiaries_male !== null && project.beneficiaries_male !== undefined ? project.beneficiaries_male : "-"}</TableCell>
                      <TableCell>{project.beneficiaries_female !== null && project.beneficiaries_female !== undefined ? project.beneficiaries_female : "-"}</TableCell>
                      <TableCell>{project.beneficiaries_boys !== null && project.beneficiaries_boys !== undefined ? project.beneficiaries_boys : "-"}</TableCell>
                      <TableCell>{project.beneficiaries_girls !== null && project.beneficiaries_girls !== undefined ? project.beneficiaries_girls : "-"}</TableCell>

                      {/* Project quality */}
                      <TableCell>
                        <Chip
                          label={project.classification_status}
                          color={isClassified ? "success" : "warning"}
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      </TableCell>
                      <TableCell>{project.duration_months ? `${project.duration_months} Months` : "-"}</TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project.outcome_impact_notes}>
                        {project.outcome_impact_notes || "-"}
                      </TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={project.remarks}>
                        {project.remarks || "-"}
                      </TableCell>

                      {/* Actions Column sticky to right */}
                      <TableCell
                        sx={{
                          position: "sticky",
                          right: 0,
                          backgroundColor: "#fff",
                          boxShadow: "-2px 0 5px rgba(0,0,0,0.05)",
                          zIndex: 1
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                              navigate(`/project/${project.project_id}`)
                            }
                            sx={{
                              textTransform: "none",
                              borderRadius: "20px",
                              fontWeight: "bold",
                              fontSize: "11px",
                              backgroundColor: "#0284c7",
                              "&:hover": { backgroundColor: "#0369a1" },
                              boxShadow: "none",
                              px: 2
                            }}
                          >
                            Details
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color={isClassified ? "success" : "warning"}
                            onClick={() =>
                              navigate(`/project/${project.project_id}`)
                            }
                            sx={{
                              textTransform: "none",
                              borderRadius: "20px",
                              fontWeight: "bold",
                              fontSize: "11px",
                              px: 2,
                              borderWidth: "1.5px",
                              "&:hover": { borderWidth: "1.5px" }
                            }}
                          >
                            {isClassified ? "Classified" : "Classify"}
                          </Button>
                          <IconButton
                            color="error"
                            size="small"
                            title="Delete Project"
                            onClick={() =>
                              handleDelete(
                                project.project_id,
                                project.project_name
                              )
                            }
                            sx={{
                              backgroundColor: "#fef2f2",
                              color: "#ef4444",
                              "&:hover": { backgroundColor: "#fee2e2" },
                              p: 0.8
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* --- BULK AI CLASSIFY DIALOG MODAL --- */}
      <Dialog open={bulkOpen} onClose={() => !bulkLoading && setBulkOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", color: "#0f172a" }}>
          AI Bulk Classification Pipeline
        </DialogTitle>
        <DialogContent>
          {bulkLoading ? (
            <Box sx={{ p: 4, textItems: "center", display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body1">AI Classifier is analyzing details for {selectedIds.length} projects...</Typography>
              <LinearProgress color="secondary" sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Review AI suggested classifications. You can make adjustments before saving them to database.
              </Alert>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Project Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold", width: "250px" }}>Theme</TableCell>
                      <TableCell sx={{ fontWeight: "bold", width: "120px" }}>Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bulkSuggestions.map((item, idx) => (
                      <TableRow key={item.projectId} hover>
                        <TableCell sx={{ fontWeight: "500", fontSize: "13px" }}>{item.projectName}</TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
                            <Select
                              value={item.suggestion.themeId || ""}
                              onChange={(e) => handleBulkChangeTheme(idx, Number(e.target.value))}
                            >
                              {themes.map(t => (
                                <MenuItem key={t.theme_id} value={t.theme_id}>{t.theme_name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${item.suggestion.confidence}%`}
                            color={item.suggestion.confidence >= 70 ? "success" : "warning"}
                            size="small"
                            sx={{ fontWeight: "bold" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button disabled={bulkLoading} onClick={() => setBulkOpen(false)} color="inherit" sx={{ fontWeight: "bold" }}>
            Cancel
          </Button>
          <Button
            disabled={bulkLoading || bulkSuggestions.length === 0}
            onClick={saveBulkClassification}
            variant="contained"
            color="success"
            sx={{ fontWeight: "bold", textTransform: "none" }}
          >
            Apply & Save Suggestions
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}