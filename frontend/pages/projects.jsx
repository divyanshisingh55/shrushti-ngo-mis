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
  Divider
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
  SmartToy as AiIcon
} from "@mui/icons-material";

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
  const [status, setStatus] = useState(""); // classification status
  const [agencyId, setAgencyId] = useState("");
  const [fundingSourceId, setFundingSourceId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [statusId, setStatusId] = useState(""); // implementation status
  const [themeId, setThemeId] = useState("");
  const [subThemeId, setSubThemeId] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [activityTypeId, setActivityTypeId] = useState("");
  const [sdgId, setSdgId] = useState("");
  const [beneficiaryGroup, setBeneficiaryGroup] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [approvalDateStart, setApprovalDateStart] = useState("");
  const [approvalDateEnd, setApprovalDateEnd] = useState("");
  const [viewArchived, setViewArchived] = useState(false);

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

  // --- BULK AI CLASSIFY DIALOG ---
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSuggestions, setBulkSuggestions] = useState([]);

  useEffect(() => {
    fetchMetadata();
    loadPresets();
  }, []);

  // Trigger reload on filter values change
  useEffect(() => {
    fetchProjects();
  }, [
    search, docNo, year, status, agencyId, fundingSourceId, stateId,
    districtId, blockId, statusId, themeId, subThemeId, targetGroupId,
    activityTypeId, sdgId, beneficiaryGroup, minAmount, maxAmount,
    approvalDateStart, approvalDateEnd, viewArchived
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
    const params = {
      search,
      doc_no: docNo,
      year,
      status, // classification_status
      agency_id: agencyId,
      funding_source_id: fundingSourceId,
      state_id: stateId,
      district_id: districtId,
      block_id: blockId,
      status_id: statusId,
      theme_id: themeId,
      sub_theme_id: subThemeId,
      target_group_id: targetGroupId,
      activity_type_id: activityTypeId,
      sdg_id: sdgId,
      beneficiary_group: beneficiaryGroup,
      min_amount: minAmount,
      max_amount: maxAmount,
      approval_date_start: approvalDateStart,
      approval_date_end: approvalDateEnd,
      is_archived: viewArchived
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
      search, docNo, year, status, agencyId, fundingSourceId, stateId,
      districtId, blockId, statusId, themeId, subThemeId, targetGroupId,
      activityTypeId, sdgId, beneficiaryGroup, minAmount, maxAmount,
      approvalDateStart, approvalDateEnd, viewArchived
    };

    const updatedPresets = { ...presets, [presetName]: currentFilters };
    setPresets(updatedPresets);
    localStorage.setItem("shrushti_filter_presets", JSON.stringify(updatedPresets));
    setPresetName("");
    alert(`Preset "${presetName}" saved!`);
  };

  const applyPreset = (name) => {
    const filters = presets[name];
    if (filters) {
      setSearch(filters.search || "");
      setDocNo(filters.docNo || "");
      setYear(filters.year || "");
      setStatus(filters.status || "");
      setAgencyId(filters.agencyId || "");
      setFundingSourceId(filters.fundingSourceId || "");
      setStateId(filters.stateId || "");
      setDistrictId(filters.districtId || "");
      setBlockId(filters.blockId || "");
      setStatusId(filters.statusId || "");
      setThemeId(filters.themeId || "");
      setSubThemeId(filters.subThemeId || "");
      setTargetGroupId(filters.targetGroupId || "");
      setActivityTypeId(filters.activityTypeId || "");
      setSdgId(filters.sdgId || "");
      setBeneficiaryGroup(filters.beneficiaryGroup || "");
      setMinAmount(filters.minAmount || "");
      setMaxAmount(filters.maxAmount || "");
      setApprovalDateStart(filters.approvalDateStart || "");
      setApprovalDateEnd(filters.approvalDateEnd || "");
      setViewArchived(filters.viewArchived || false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDocNo("");
    setYear("");
    setStatus("");
    setAgencyId("");
    setFundingSourceId("");
    setStateId("");
    setDistrictId("");
    setBlockId("");
    setStatusId("");
    setThemeId("");
    setSubThemeId("");
    setTargetGroupId("");
    setActivityTypeId("");
    setSdgId("");
    setBeneficiaryGroup("");
    setMinAmount("");
    setMaxAmount("");
    setApprovalDateStart("");
    setApprovalDateEnd("");
    setViewArchived(false);
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

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>

      {/* Header Panel */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}>
            NGO Projects
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b" }}>
            Manage, duplicate, archive, and run AI-assisted bulk classification.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
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
              <TextField fullWidth label="Search Project Name" size="small" value={search} onChange={(e) => setSearch(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Doc Number" size="small" value={docNo} onChange={(e) => setDocNo(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Financial Year" size="small" value={year} placeholder="e.g. 2024-25" onChange={(e) => setYear(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Executing Agency</InputLabel>
                <Select value={agencyId} label="Executing Agency" onChange={(e) => setAgencyId(e.target.value)}>
                  <MenuItem value="">All Agencies</MenuItem>
                  {agencies.map(a => <MenuItem key={a.agency_id} value={a.agency_id}>{a.agency_name}</MenuItem>)}
                </Select>
              </FormControl>
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Target Beneficiaries</InputLabel>
                <Select value={targetGroupId} label="Target Beneficiaries" onChange={(e) => setTargetGroupId(e.target.value)}>
                  <MenuItem value="">All Target Groups</MenuItem>
                  {targetGroups.map(tg => (
                    <MenuItem key={tg.target_group_id} value={tg.target_group_id}>{tg.main_group} - {tg.sub_group}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Activity Type</InputLabel>
                <Select value={activityTypeId} label="Activity Type" onChange={(e) => setActivityTypeId(e.target.value)}>
                  <MenuItem value="">All Activities</MenuItem>
                  {activityTypes.map(at => (
                    <MenuItem key={at.activity_type_id} value={at.activity_type_id}>{at.activity_type_name}</MenuItem>
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

            {/* Financial and Date Filters */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Min Sanction Amount" type="number" size="small" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Max Sanction Amount" type="number" size="small" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Approved After" type="date" slotProps={{ inputLabel: { shrink: true } }} size="small" value={approvalDateStart} onChange={(e) => setApprovalDateStart(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField fullWidth label="Approved Before" type="date" slotProps={{ inputLabel: { shrink: true } }} size="small" value={approvalDateEnd} onChange={(e) => setApprovalDateEnd(e.target.value)} />
            </Grid>

            {/* Beneficiary Category and Status */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Beneficiary Filter</InputLabel>
                <Select value={beneficiaryGroup} label="Beneficiary Filter" onChange={(e) => setBeneficiaryGroup(e.target.value)}>
                  <MenuItem value="">All Groups</MenuItem>
                  {["Women", "Girls", "Boys", "Men", "Youth", "Farmers", "SHGs", "Teachers", "Persons with Disabilities", "Elderly"].map(g => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Classification Status</InputLabel>
                <Select value={status} label="Classification Status" onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="">All Classification Statuses</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
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
              <FormControl fullWidth size="small">
                <InputLabel>Scope View</InputLabel>
                <Select value={viewArchived} label="Scope View" onChange={(e) => setViewArchived(e.target.value)}>
                  <MenuItem value={false}>Active Projects Only</MenuItem>
                  <MenuItem value={true}>Archived Projects Only</MenuItem>
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
                <FormControl size="small" sx={{ width: "200px" }}>
                  <InputLabel>Load Filter Preset</InputLabel>
                  <Select value="" label="Load Filter Preset" onChange={(e) => applyPreset(e.target.value)}>
                    <MenuItem value="">-- Load Preset --</MenuItem>
                    {Object.keys(presets).map(name => (
                      <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
            <Button variant="outlined" color="inherit" size="small" startIcon={<ClearIcon />} onClick={clearFilters}>
              Clear Filters
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Table section */}
      <Box sx={{ position: "relative", width: "100%" }}>
        {/* Loading Progress Bar at the top of the table to prevent layout shifts */}
        <Box sx={{ height: "4px", width: "100%", mb: 1 }}>
          {loading && <LinearProgress color="primary" />}
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)",
            overflowX: "hidden",
            width: "100%",
            opacity: loading ? 0.6 : 1,
            transition: "opacity 0.2s ease-in-out"
          }}
        >
          <Table
            sx={{
              tableLayout: "fixed",
              width: "100%"
            }}
          >
            <TableHead sx={{ backgroundColor: "#f8fafc" }}>
              <TableRow>
                <TableCell padding="checkbox">
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

                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>
                  ID
                </TableCell>

                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>
                  Project Name
                </TableCell>

                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>
                  Year
                </TableCell>

                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>
                  Agency
                </TableCell>

                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>
                  State
                </TableCell>

                <TableCell sx={{ fontWeight: "bold", color: "#475569" }}>
                  Classification Status
                </TableCell>

                <TableCell
                  sx={{
                    width: "220px",
                    minWidth: "220px",
                    fontWeight: "bold",
                    color: "#475569",
                    textAlign: "center"
                  }}
                >
                  Actions
                </TableCell>

              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>
                    No projects found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => {
                  const isChecked = selectedIds.includes(project.project_id);
                  return (
                    <TableRow key={project.project_id} hover checked={isChecked}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={isChecked} onChange={(e) => handleSelectRow(e, project.project_id)} />
                      </TableCell>
                      <TableCell>{project.project_id}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: "250px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 600
                        }}
                        title={project.project_name}
                      >
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
                      <TableCell
                        sx={{
                          width: "220px",
                          minWidth: "220px"
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
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              navigate(`/project/${project.project_id}`)
                            }
                          >
                            Classify
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