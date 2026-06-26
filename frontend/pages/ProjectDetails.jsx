import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Stack,
  Alert,
  Autocomplete
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  FolderOpen as FolderIcon,
  AssignmentTurnedIn as CompleteIcon,
  PendingActions as PendingIcon,
  SmartToy as AiIcon
} from "@mui/icons-material";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI Suggestion states
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAiSuggestion = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/ai-classify/${id}/suggest`);
      if (res.data.success) {
        setAiSuggestion(res.data.suggestion);
      } else {
        alert("Failed to fetch AI classification suggestions");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  // DB Dropdowns
  const [themes, setThemes] = useState([]);
  const [subThemes, setSubThemes] = useState([]);
  const [targetGroups, setTargetGroups] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [states, setStates] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const SUBTHEME1_NAMES = ["Education", "Health", "Livelihood", "Skill Development", "Capacity Building", "Water", "Awareness", "Climate Resilience", "Research", "Monitoring", "Agriculture"];
  const SUBTHEME2_NAMES = ["Primary Education", "Preprimary Education", "Secondary Education", "Maternal Health", "Eye Health", "Nutrition", "Disabilities", "Construction", "Behavior Change", "Evaluation Study", "Youth Development", "Water", "Community Mobilization"];
  const SUBTHEME3_NAMES = ["Reproductive Health", "Entrepreneurship", "Advocacy", "Natural Resource Management", "Impact Assessment", "Data Collection", "Water Management", "Check Dem construction", "ECCE", "Counselling", "WASH", "Social Securities", "Social Campaign"];

  // Form States (for editing core details)
  const [editName, setEditName] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editApprovalDate, setEditApprovalDate] = useState("");
  const [editSanctionedAmount, setEditSanctionedAmount] = useState("");
  const [editStatusId, setEditStatusId] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [agencySelect, setAgencySelect] = useState("");
  const [customAgency, setCustomAgency] = useState("");
  const [fundingSelect, setFundingSelect] = useState("");
  const [customFunding, setCustomFunding] = useState("");
  const [selectedStates, setSelectedStates] = useState([{ state_id: "", custom_name: "" }]);

  // Classification States
  const [selectedThemes, setSelectedThemes] = useState([{ themeId: "", subThemeIds: [] }]);
  const [selectedTargetGroups, setSelectedTargetGroups] = useState([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState([]);
  const [selectedSdgs, setSelectedSdgs] = useState([]);
  const [projectSummary, setProjectSummary] = useState("");

  // Beneficiary and Age Groups
  const [beneficiaryGroups, setBeneficiaryGroups] = useState([]);
  const [beneficiaryCat1, setBeneficiaryCat1] = useState([]);
  const [beneficiaryCat2, setBeneficiaryCat2] = useState([]);
  const [beneficiaryCat3, setBeneficiaryCat3] = useState([]);
  const [beneficiaryCat4, setBeneficiaryCat4] = useState([]);
  const [ageGroups, setAgeGroups] = useState([]);

  // SDGs
  const [sdgs, setSdgs] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStateChange = (index, field, value) => {
    const updated = [...selectedStates];
    updated[index][field] = value;
    setSelectedStates(updated);
  };

  const handleAddStateRow = () => {
    setSelectedStates([...selectedStates, { state_id: "", custom_name: "" }]);
  };

  const handleRemoveStateRow = (index) => {
    setSelectedStates(selectedStates.filter((_, idx) => idx !== index));
  };

  const handleThemeChange = (index, themeId) => {
    const updated = [...selectedThemes];
    updated[index].themeId = themeId;
    updated[index].subThemeIds = []; // reset subthemes
    setSelectedThemes(updated);
  };

  const handleSubThemeChange = (index, subThemeIds) => {
    const updated = [...selectedThemes];
    updated[index].subThemeIds = subThemeIds;
    setSelectedThemes(updated);
  };

  const handleAddThemeRow = () => {
    setSelectedThemes([...selectedThemes, { themeId: "", subThemeIds: [] }]);
  };

  const handleRemoveThemeRow = (index) => {
    setSelectedThemes(selectedThemes.filter((_, idx) => idx !== index));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch project details (with classification)
      const projectRes = await axios.get(`http://localhost:5000/project/${id}`);
      const proj = projectRes.data;
      setProject(proj);

      // Pre-populate core details form fields
      setEditName(proj.project_name || "");
      setEditYear(proj.year || "");
      setEditRemarks(proj.remarks || "");
      setEditStatusId(proj.status_id || "");
      setEditSanctionedAmount(proj.sanctioned_amount || "");
      setEditApprovalDate(proj.approval_date ? new Date(proj.approval_date).toISOString().split('T')[0] : "");
      
      setAgencySelect(proj.agency_id || "");
      setFundingSelect(proj.funding_source_id || "");
      
      if (proj.state_ids && proj.state_ids.length > 0) {
        setSelectedStates(proj.state_ids.map(sid => ({ state_id: sid, custom_name: "" })));
      } else {
        setSelectedStates([{ state_id: proj.state_id || "", custom_name: "" }]);
      }

      // Pre-populate classification dropdowns
      if (proj.classification) {
        setSelectedTargetGroups(proj.classification.target_group_ids || []);
        setSelectedActivityTypes(proj.classification.activity_type_ids || []);
        setSelectedSdgs(proj.classification.sdg_ids || []);

        if (proj.classification.themes && proj.classification.themes.length > 0) {
          setSelectedThemes(proj.classification.themes);
        } else if (proj.classification.theme_id) {
          setSelectedThemes([{ themeId: proj.classification.theme_id, subThemeIds: proj.classification.sub_theme_ids || [] }]);
        } else {
          setSelectedThemes([{ themeId: "", subThemeIds: [] }]);
        }
      }

      setProjectSummary(proj.project_summary || "");
      setBeneficiaryGroups(proj.beneficiary_groups ? proj.beneficiary_groups.split(',') : []);
      setBeneficiaryCat1(proj.beneficiary_cat1 ? proj.beneficiary_cat1.split(',') : []);
      setBeneficiaryCat2(proj.beneficiary_cat2 ? proj.beneficiary_cat2.split(',') : []);
      setBeneficiaryCat3(proj.beneficiary_cat3 ? proj.beneficiary_cat3.split(',') : []);
      setBeneficiaryCat4(proj.beneficiary_cat4 ? proj.beneficiary_cat4.split(',') : []);
      setAgeGroups(proj.age_groups ? proj.age_groups.split(',') : []);

      // 2. Fetch all metadata dropdowns
      const [themesRes, subThemesRes, targetGroupsRes, activityTypesRes, agenciesRes, fundingRes, statesRes, statusesRes, sdgsRes] = await Promise.all([
        axios.get("http://localhost:5000/themes"),
        axios.get("http://localhost:5000/subthemes"),
        axios.get("http://localhost:5000/targetgroups"),
        axios.get("http://localhost:5000/activitytypes"),
        axios.get("http://localhost:5000/agencies"),
        axios.get("http://localhost:5000/fundingsources"),
        axios.get("http://localhost:5000/states"),
        axios.get("http://localhost:5000/statuses"),
        axios.get("http://localhost:5000/sdgs")
      ]);

      setThemes(themesRes.data.data || themesRes.data);
      setSubThemes(subThemesRes.data);
      setTargetGroups(targetGroupsRes.data);
      setActivityTypes(activityTypesRes.data);
      setAgencies(agenciesRes.data);
      setFundingSources(fundingRes.data);
      setStates(statesRes.data);
      setStatuses(statusesRes.data.filter(s => s.status_name === 'Pending' || s.status_name === 'Ongoing'));
      setSdgs(sdgsRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load project details.");
      setLoading(false);
    }
  };

  // Triggered when editing project details is submitted
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    const agencyVal = agencySelect === "custom" ? customAgency : agencySelect;
    const fundingVal = fundingSelect === "custom" ? customFunding : fundingSelect;
    
    const resolvedStates = selectedStates.map(stObj => {
      return stObj.state_id === "custom" ? stObj.custom_name : stObj.state_id;
    }).filter(Boolean);

    try {
      await axios.put(`http://localhost:5000/projects/${id}`, {
        project_name: editName,
        agency: agencyVal,
        year: editYear,
        funding_source: fundingVal,
        approval_date: editApprovalDate || null,
        sanctioned_amount: editSanctionedAmount || null,
        status_id: editStatusId || null,
        state: resolvedStates,
        remarks: editRemarks
      });
      setIsEditing(false);
      loadData();
    } catch (err) {
      console.error("Update Error:", err);
      alert(err.response?.data?.message || "Failed to update project details");
    }
  };

  const handleAddTargetGroup = (e) => {
    const val = Number(e.target.value);
    if (!val) return;
    if (!selectedTargetGroups.includes(val)) {
      setSelectedTargetGroups([...selectedTargetGroups, val]);
    }
    e.target.value = "";
  };

  const handleRemoveTargetGroup = (tgId) => {
    setSelectedTargetGroups(selectedTargetGroups.filter(x => x !== tgId));
  };

  const handleAddActivityType = (e) => {
    const val = Number(e.target.value);
    if (!val) return;
    if (!selectedActivityTypes.includes(val)) {
      setSelectedActivityTypes([...selectedActivityTypes, val]);
    }
    e.target.value = "";
  };

  const handleRemoveActivityType = (atId) => {
    setSelectedActivityTypes(selectedActivityTypes.filter(x => x !== atId));
  };

  // Save classifications to DB
  const saveClassification = async () => {
    try {
      const activeThemes = selectedThemes.filter(t => t.themeId);
      if (activeThemes.length === 0) {
        alert("Please select at least one Theme.");
        return;
      }

      const response = await axios.post(`http://localhost:5000/classify-project/${id}`, {
        themes: activeThemes.map(t => ({
          themeId: Number(t.themeId),
          subThemeIds: t.subThemeIds
        })),
        targetGroupIds: selectedTargetGroups,
        activityTypeIds: selectedActivityTypes,
        sdgIds: selectedSdgs,
        projectSummary: projectSummary,
        beneficiaryGroups: beneficiaryGroups,
        beneficiaryCat1: beneficiaryCat1,
        beneficiaryCat2: beneficiaryCat2,
        beneficiaryCat3: beneficiaryCat3,
        beneficiaryCat4: beneficiaryCat4,
        ageGroups: ageGroups
      });

      alert(response.data.message);
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress size={45} />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error: {error || "Project not found"}</Alert>
      </Box>
    );
  }



  return (
    <Box sx={{ flexGrow: 1, p: 1, maxWidth: "1000px", mx: "auto" }}>
      
      {/* Upper header bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: "space-between", alignItems: "center" }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate("/projects")}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          Back to Projects
        </Button>
        <Button
          variant="contained"
          startIcon={isEditing ? <CloseIcon /> : <EditIcon />}
          color={isEditing ? "inherit" : "primary"}
          onClick={() => setIsEditing(!isEditing)}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          {isEditing ? "Cancel Edit" : "Edit Core Details"}
        </Button>
      </Stack>

      {isEditing ? (
        // ------------------ EDIT FORM MODE ------------------
        <Paper sx={{ p: 4, mb: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3, color: "#1e293b" }}>
            Edit Project Core Details
          </Typography>
          <Box component="form" onSubmit={handleUpdateDetails}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField fullWidth label="Project Name" required value={editName} onChange={(e) => setEditName(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Agency</InputLabel>
                  <Select value={agencySelect} label="Agency" onChange={(e) => setAgencySelect(e.target.value)}>
                    <MenuItem value="">Select Agency</MenuItem>
                    {agencies.map(a => <MenuItem key={a.agency_id} value={a.agency_id}>{a.agency_name}</MenuItem>)}
                    <MenuItem value="custom" sx={{ color: "#3b82f6", fontWeight: "bold" }}>+ Add New Agency</MenuItem>
                  </Select>
                </FormControl>
                {agencySelect === "custom" && (
                  <TextField fullWidth label="Custom Agency Name" required size="small" sx={{ mt: 2 }} value={customAgency} onChange={(e) => setCustomAgency(e.target.value)} />
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Financial Year" value={editYear} onChange={(e) => setEditYear(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Funding Source</InputLabel>
                  <Select value={fundingSelect} label="Funding Source" onChange={(e) => setFundingSelect(e.target.value)}>
                    <MenuItem value="">Select Funding Source</MenuItem>
                    {fundingSources.map(f => <MenuItem key={f.funding_source_id} value={f.funding_source_id}>{f.source_name}</MenuItem>)}
                    <MenuItem value="custom" sx={{ color: "#3b82f6", fontWeight: "bold" }}>+ Add New Funding Source</MenuItem>
                  </Select>
                </FormControl>
                {fundingSelect === "custom" && (
                  <TextField fullWidth label="Custom Funding Source" required size="small" sx={{ mt: 2 }} value={customFunding} onChange={(e) => setCustomFunding(e.target.value)} />
                )}
              </Grid>

              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, color: "#475569" }}>
                  Select States *
                </Typography>
                {selectedStates.map((stObj, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: "center" }}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <FormControl fullWidth required>
                        <InputLabel>State</InputLabel>
                        <Select
                          value={stObj.state_id}
                          label="State"
                          onChange={(e) => handleStateChange(index, "state_id", e.target.value)}
                        >
                          <MenuItem value="">Select State</MenuItem>
                          {states.map((s) => (
                            <MenuItem key={s.state_id} value={s.state_id}>{s.state_name}</MenuItem>
                          ))}
                          <MenuItem value="custom" sx={{ color: "#3b82f6", fontWeight: "bold" }}>+ Add New State</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      {stObj.state_id === "custom" && (
                        <TextField
                          fullWidth
                          label="Custom State Name"
                          required
                          size="small"
                          value={stObj.custom_name}
                          onChange={(e) => handleStateChange(index, "custom_name", e.target.value)}
                        />
                      )}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      {selectedStates.length > 1 && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleRemoveStateRow(index)}
                          sx={{ textTransform: "none", fontWeight: "bold" }}
                        >
                          Remove
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={handleAddStateRow}
                  sx={{ textTransform: "none", fontWeight: "bold", mt: 1 }}
                >
                  + Add Another State
                </Button>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Approval Date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={editApprovalDate} onChange={(e) => setEditApprovalDate(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Sanctioned Amount (Rs.)" type="number" value={editSanctionedAmount} onChange={(e) => setEditSanctionedAmount(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Implementation Status</InputLabel>
                  <Select value={editStatusId} label="Implementation Status" onChange={(e) => setEditStatusId(e.target.value)}>
                    <MenuItem value="">Select Status</MenuItem>
                    {statuses.map(s => <MenuItem key={s.status_id} value={s.status_id}>{s.status_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <TextField fullWidth multiline rows={3} label="Remarks" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} />
              </Grid>

              <Grid size={12}>
                <Button type="submit" variant="contained" color="success" startIcon={<SaveIcon />} sx={{ textTransform: "none", fontWeight: "bold" }}>
                  Save Core Details
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      ) : (
        // ------------------ VIEW DETAILS MODE ------------------
        <Card sx={{ p: 2, mb: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", position: "relative" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1e293b", mb: 0.5 }}>
                  {project.project_name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Project ID: #{project.project_id} | Doc No: {project.doc_no || "N/A"}
                </Typography>
              </Box>
              <Chip
                icon={project.classification_status === "Completed" ? <CompleteIcon /> : <PendingIcon />}
                label={project.classification_status}
                color={project.classification_status === "Completed" ? "success" : "warning"}
                sx={{ fontWeight: "bold" }}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Executing Agency</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.agency_name || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Financial Year</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.year || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>State Location</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.state_name || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Funding Source</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.funding_source || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Approval Date</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>
                  {project.approval_date ? new Date(project.approval_date).toLocaleDateString() : "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Sanctioned Amount</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>
                  {project.sanctioned_amount ? `Rs. ${Number(project.sanctioned_amount).toLocaleString()}` : "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Implementation Status</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.project_status || "-"}</Typography>
              </Grid>
            </Grid>

            {project.remarks && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Remarks</Typography>
                <Typography variant="body2" sx={{ color: "#334155" }}>{project.remarks}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ------------------ CLASSIFICATION INTERFACE ------------------ */}
      <Paper sx={{ p: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1e293b" }}>
              Assign Project Classification
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Categorize the NGO project by selecting its primary theme and adding sub-themes, target beneficiaries, and activity types.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AiIcon />}
            onClick={fetchAiSuggestion}
            disabled={aiLoading}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "8px",
              backgroundColor: "#8b5cf6",
              "&:hover": { backgroundColor: "#7c3aed" }
            }}
          >
            {aiLoading ? <CircularProgress size={20} color="inherit" /> : "🤖 Get AI Suggestion"}
          </Button>
        </Box>

        {aiSuggestion && (
          <Box sx={{ mb: 4, p: 3, border: "1px solid #ddd6fe", borderRadius: "12px", backgroundColor: "#f5f3ff" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#6d28d9", display: "flex", alignItems: "center", gap: 1 }}>
                <AiIcon /> AI Suggested Classifications
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: "600", color: "#4c1d95" }}>
                  Overall Confidence:
                </Typography>
                <Chip
                  label={`${aiSuggestion.confidence}%`}
                  color={aiSuggestion.confidence >= 70 ? "success" : "warning"}
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
              </Stack>
            </Box>

            {aiSuggestion.confidence < 70 && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: "8px", fontWeight: "600" }}>
                Needs Manual Review (Confidence score is below 70%)
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2, borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Theme Suggestion (Confidence: {aiSuggestion.themeConfidence}%)</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155", mt: 0.5 }}>
                    {aiSuggestion.themeName || themes.find(t => t.theme_id === aiSuggestion.themeId)?.theme_name || "None"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2, borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Sub-Themes Suggestion (Confidence: {aiSuggestion.subThemeConfidence}%)</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {aiSuggestion.subThemeIds.length === 0 ? "-" : aiSuggestion.subThemeIds.map(stId => {
                      const st = subThemes.find(x => x.sub_theme_id === stId);
                      return st ? <Chip key={stId} label={st.sub_theme_name} size="small" variant="outlined" /> : null;
                    })}
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2, borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Target Groups Suggestion (Confidence: {aiSuggestion.targetGroupConfidence}%)</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {aiSuggestion.targetGroupIds.length === 0 ? "-" : aiSuggestion.targetGroupIds.map(tgId => {
                      const tg = targetGroups.find(x => x.target_group_id === tgId);
                      return tg ? <Chip key={tgId} label={`${tg.main_group} - ${tg.sub_group}`} size="small" variant="outlined" /> : null;
                    })}
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2, borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Activity Types Suggestion (Confidence: {aiSuggestion.activityConfidence}%)</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {aiSuggestion.activityTypeIds.length === 0 ? "-" : aiSuggestion.activityTypeIds.map(atId => {
                      const at = activityTypes.find(x => x.activity_type_id === atId);
                      return at ? <Chip key={atId} label={at.activity_type_name} size="small" variant="outlined" /> : null;
                    })}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                setSelectedTheme(aiSuggestion.themeId || "");
                setSelectedSubThemes(aiSuggestion.subThemeIds || []);
                setSelectedTargetGroups(aiSuggestion.targetGroupIds || []);
                setSelectedActivityTypes(aiSuggestion.activityTypeIds || []);
              }}
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: "8px",
                backgroundColor: "#7c3aed",
                "&:hover": { backgroundColor: "#6d28d9" }
              }}
            >
              Accept AI Suggestions & Auto-Fill
            </Button>
          </Box>
        )}

        <Grid container spacing={4}>
          {/* Multiple Themes & Subthemes */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              1. Thematic Areas & Sub-Themes
            </Typography>
            {selectedThemes.map((t, index) => {
              const sub1Selected = subThemes.filter(st => st.theme_id === Number(t.themeId) && t.subThemeIds.includes(st.sub_theme_id) && SUBTHEME1_NAMES.includes(st.sub_theme_name));
              const sub2Selected = subThemes.filter(st => st.theme_id === Number(t.themeId) && t.subThemeIds.includes(st.sub_theme_id) && SUBTHEME2_NAMES.includes(st.sub_theme_name));
              const sub3Selected = subThemes.filter(st => st.theme_id === Number(t.themeId) && t.subThemeIds.includes(st.sub_theme_id) && SUBTHEME3_NAMES.includes(st.sub_theme_name));

              return (
                <Paper key={index} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: "8px", position: "relative" }}>
                  {selectedThemes.length > 1 && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={() => handleRemoveThemeRow(index)}
                      sx={{ position: "absolute", right: 10, top: 10, textTransform: "none", fontWeight: "bold" }}
                    >
                      Remove Theme Block
                    </Button>
                  )}
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, color: "#0f766e" }}>
                    Theme #{index + 1}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <Autocomplete
                        options={themes}
                        getOptionLabel={(option) => option.theme_name || ""}
                        value={themes.find((theme) => theme.theme_id === Number(t.themeId)) || null}
                        onChange={(event, newValue) => {
                          handleThemeChange(index, newValue ? newValue.theme_id : "");
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Thematic Area"
                            size="small"
                            required
                          />
                        )}
                      />
                    </Grid>

                    {t.themeId && (
                      <>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Autocomplete
                            multiple
                            options={subThemes.filter(st => st.theme_id === Number(t.themeId) && SUBTHEME1_NAMES.includes(st.sub_theme_name))}
                            getOptionLabel={(option) => option.sub_theme_name || ""}
                            value={sub1Selected}
                            onChange={(event, newValue) => {
                              const newSubThemeIds = [
                                ...newValue.map(x => x.sub_theme_id),
                                ...sub2Selected.map(x => x.sub_theme_id),
                                ...sub3Selected.map(x => x.sub_theme_id)
                              ];
                              handleSubThemeChange(index, newSubThemeIds);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Subtheme 1 Options"
                                placeholder="Choose subtheme 1..."
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Autocomplete
                            multiple
                            options={subThemes.filter(st => st.theme_id === Number(t.themeId) && SUBTHEME2_NAMES.includes(st.sub_theme_name))}
                            getOptionLabel={(option) => option.sub_theme_name || ""}
                            value={sub2Selected}
                            onChange={(event, newValue) => {
                              const newSubThemeIds = [
                                ...sub1Selected.map(x => x.sub_theme_id),
                                ...newValue.map(x => x.sub_theme_id),
                                ...sub3Selected.map(x => x.sub_theme_id)
                              ];
                              handleSubThemeChange(index, newSubThemeIds);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Subtheme 2 Options"
                                placeholder="Choose subtheme 2..."
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Autocomplete
                            multiple
                            options={subThemes.filter(st => st.theme_id === Number(t.themeId) && SUBTHEME3_NAMES.includes(st.sub_theme_name))}
                            getOptionLabel={(option) => option.sub_theme_name || ""}
                            value={sub3Selected}
                            onChange={(event, newValue) => {
                              const newSubThemeIds = [
                                ...sub1Selected.map(x => x.sub_theme_id),
                                ...sub2Selected.map(x => x.sub_theme_id),
                                ...newValue.map(x => x.sub_theme_id)
                              ];
                              handleSubThemeChange(index, newSubThemeIds);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Subtheme 3 Options"
                                placeholder="Choose subtheme 3..."
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Paper>
              );
            })}
            <Button
              variant="outlined"
              color="primary"
              onClick={handleAddThemeRow}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              + Add Another Theme Block
            </Button>
          </Grid>



          {/* Beneficiary Categories */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              2. Beneficiary Groups & Categories
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={["Women", "Men", "Children", "Youth", "All"]}
                  value={beneficiaryGroups}
                  onChange={(event, newValue) => setBeneficiaryGroups(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Beneficiary Groups" placeholder="Select or type..." size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={["Boy", "Girl", "Adolescent Girl", "Pregnant & Lactating women", "Drop out"]}
                  value={beneficiaryCat1}
                  onChange={(event, newValue) => setBeneficiaryCat1(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Category 1 Option" placeholder="Select or type..." size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={["Farmers", "Villagers", "Community", "School Children"]}
                  value={beneficiaryCat2}
                  onChange={(event, newValue) => setBeneficiaryCat2(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Category 2 Option" placeholder="Select or type..." size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={["Tribal", "PVGT"]}
                  value={beneficiaryCat3}
                  onChange={(event, newValue) => setBeneficiaryCat3(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Category 3 Option" placeholder="Select or type..." size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={["Urban", "Rural"]}
                  value={beneficiaryCat4}
                  onChange={(event, newValue) => setBeneficiaryCat4(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Category 4 Option" placeholder="Select or type..." size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={["0-3", "3-6", "6-14", "14-18", "18-25", "25-60", "60 & Above"]}
                  value={ageGroups}
                  onChange={(event, newValue) => setAgeGroups(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Age Groups" placeholder="Select or type..." size="small" />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* SDGs */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              3. Sustainable Development Goals (SDGs)
            </Typography>
            <Autocomplete
              multiple
              options={sdgs}
              getOptionLabel={(option) => option ? `${option.sdg_code} - ${option.sdg_name}` : ""}
              value={sdgs.filter(s => selectedSdgs.includes(s.sdg_id))}
              onChange={(event, newValue) => {
                setSelectedSdgs(newValue.map(option => option.sdg_id));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select SDG Goals"
                  placeholder="Choose SDGs..."
                  size="small"
                />
              )}
            />
          </Grid>

          {/* Activity Types */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              4. Activity Types
            </Typography>
            <Autocomplete
              multiple
              options={activityTypes.filter(at => !selectedActivityTypes.includes(at.activity_type_id))}
              getOptionLabel={(option) => option.activity_type_name || ""}
              value={activityTypes.filter(at => selectedActivityTypes.includes(at.activity_type_id))}
              onChange={(event, newValue) => {
                setSelectedActivityTypes(newValue.map(option => option.activity_type_id));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Choose Activity Types"
                  placeholder="Select activity types..."
                  size="small"
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key || option.activity_type_id}
                      label={option.activity_type_name}
                      {...chipProps}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  );
                })
              }
            />
          </Grid>

          {/* Project Summary */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              5. Project Summary
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Enter Project Summary / Abstract"
              value={projectSummary}
              onChange={(e) => setProjectSummary(e.target.value)}
              placeholder="Provide a detailed summary of the project goals, impact, and operations..."
            />
          </Grid>

          {/* Save Button */}
          <Grid size={12} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={saveClassification}
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                py: 1.5,
                fontSize: "16px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)"
              }}
            >
              Save Project Classification
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}