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
  Alert
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  FolderOpen as FolderIcon,
  AssignmentTurnedIn as CompleteIcon,
  PendingActions as PendingIcon
} from "@mui/icons-material";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // DB Dropdowns
  const [themes, setThemes] = useState([]);
  const [subThemes, setSubThemes] = useState([]);
  const [targetGroups, setTargetGroups] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [states, setStates] = useState([]);
  const [statuses, setStatuses] = useState([]);

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
  const [stateSelect, setStateSelect] = useState("");
  const [customState, setCustomState] = useState("");

  // Classification States
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedSubThemes, setSelectedSubThemes] = useState([]);
  const [selectedTargetGroups, setSelectedTargetGroups] = useState([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

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
      setStateSelect(proj.state_id || "");

      // Pre-populate classification dropdowns
      if (proj.classification) {
        setSelectedTheme(proj.classification.theme_id || "");
        setSelectedSubThemes(proj.classification.sub_theme_ids || []);
        setSelectedTargetGroups(proj.classification.target_group_ids || []);
        setSelectedActivityTypes(proj.classification.activity_type_ids || []);
      }

      // 2. Fetch all metadata dropdowns
      const [themesRes, subThemesRes, targetGroupsRes, activityTypesRes, agenciesRes, fundingRes, statesRes, statusesRes] = await Promise.all([
        axios.get("http://localhost:5000/themes"),
        axios.get("http://localhost:5000/subthemes"),
        axios.get("http://localhost:5000/targetgroups"),
        axios.get("http://localhost:5000/activitytypes"),
        axios.get("http://localhost:5000/agencies"),
        axios.get("http://localhost:5000/fundingsources"),
        axios.get("http://localhost:5000/states"),
        axios.get("http://localhost:5000/statuses")
      ]);

      setThemes(themesRes.data.data || themesRes.data);
      setSubThemes(subThemesRes.data);
      setTargetGroups(targetGroupsRes.data);
      setActivityTypes(activityTypesRes.data);
      setAgencies(agenciesRes.data);
      setFundingSources(fundingRes.data);
      setStates(statesRes.data);
      setStatuses(statusesRes.data);

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
    const stateVal = stateSelect === "custom" ? customState : stateSelect;

    try {
      await axios.put(`http://localhost:5000/projects/${id}`, {
        project_name: editName,
        agency: agencyVal,
        year: editYear,
        funding_source: fundingVal,
        approval_date: editApprovalDate || null,
        sanctioned_amount: editSanctionedAmount || null,
        status_id: editStatusId || null,
        state: stateVal,
        remarks: editRemarks
      });
      setIsEditing(false);
      loadData();
    } catch (err) {
      console.error("Update Error:", err);
      alert(err.response?.data?.message || "Failed to update project details");
    }
  };

  // Classification Handlers
  const handleAddSubTheme = (e) => {
    const val = Number(e.target.value);
    if (!val) return;
    if (!selectedSubThemes.includes(val)) {
      setSelectedSubThemes([...selectedSubThemes, val]);
    }
    e.target.value = "";
  };

  const handleRemoveSubTheme = (stId) => {
    setSelectedSubThemes(selectedSubThemes.filter(x => x !== stId));
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
      if (!selectedTheme) {
        alert("Please select a Primary Theme.");
        return;
      }

      const response = await axios.post(`http://localhost:5000/classify-project/${id}`, {
        themeId: Number(selectedTheme),
        subThemeIds: selectedSubThemes,
        targetGroupIds: selectedTargetGroups,
        activityTypeIds: selectedActivityTypes
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

  // Filter lists for multi-select selections
  const availableSubThemes = subThemes.filter(st => {
    const matchesTheme = Number(selectedTheme) ? st.theme_id === Number(selectedTheme) : false;
    const notSelected = !selectedSubThemes.includes(st.sub_theme_id);
    return matchesTheme && notSelected;
  });

  const availableTargetGroups = targetGroups.filter(tg => !selectedTargetGroups.includes(tg.target_group_id));
  const availableActivityTypes = activityTypes.filter(at => !selectedActivityTypes.includes(at.activity_type_id));

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
              <Grid item xs={12}>
                <TextField fullWidth label="Project Name" required value={editName} onChange={(e) => setEditName(e.target.value)} />
              </Grid>

              <Grid item xs={12} sm={6}>
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

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Financial Year" value={editYear} onChange={(e) => setEditYear(e.target.value)} />
              </Grid>

              <Grid item xs={12} sm={6}>
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

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>State</InputLabel>
                  <Select value={stateSelect} label="State" onChange={(e) => setStateSelect(e.target.value)}>
                    <MenuItem value="">Select State</MenuItem>
                    {states.map(s => <MenuItem key={s.state_id} value={s.state_id}>{s.state_name}</MenuItem>)}
                    <MenuItem value="custom" sx={{ color: "#3b82f6", fontWeight: "bold" }}>+ Add New State</MenuItem>
                  </Select>
                </FormControl>
                {stateSelect === "custom" && (
                  <TextField fullWidth label="Custom State" required size="small" sx={{ mt: 2 }} value={customState} onChange={(e) => setCustomState(e.target.value)} />
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Approval Date" type="date" InputLabelProps={{ shrink: true }} value={editApprovalDate} onChange={(e) => setEditApprovalDate(e.target.value)} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Sanctioned Amount (Rs.)" type="number" value={editSanctionedAmount} onChange={(e) => setEditSanctionedAmount(e.target.value)} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Implementation Status</InputLabel>
                  <Select value={editStatusId} label="Implementation Status" onChange={(e) => setEditStatusId(e.target.value)}>
                    <MenuItem value="">Select Status</MenuItem>
                    {statuses.map(s => <MenuItem key={s.status_id} value={s.status_id}>{s.status_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Remarks" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} />
              </Grid>

              <Grid item xs={12}>
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
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Executing Agency</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.agency_name || "-"}</Typography>
              </Grid>
              <Grid item xs={6} sm={6} md={4}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Financial Year</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.year || "-"}</Typography>
              </Grid>
              <Grid item xs={6} sm={6} md={4}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>State Location</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.state_name || "-"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Funding Source</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.funding_source || "-"}</Typography>
              </Grid>
              <Grid item xs={6} sm={6} md={4}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Approval Date</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>
                  {project.approval_date ? new Date(project.approval_date).toLocaleDateString() : "-"}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={6} md={4}>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Sanctioned Amount</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>
                  {project.sanctioned_amount ? `Rs. ${Number(project.sanctioned_amount).toLocaleString()}` : "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
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
      <Paper sx={{ p: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: "#1e293b" }}>
          Assign Project Classification
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mb: 4 }}>
          Categorize the NGO project by selecting its primary theme and adding sub-themes, target beneficiaries, and activity types.
        </Typography>

        <Grid container spacing={3}>
          {/* Primary Theme */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, color: "#475569" }}>
              1. Primary Thematic Area *
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Select Primary Theme</InputLabel>
              <Select
                value={selectedTheme}
                label="Select Primary Theme"
                onChange={(e) => {
                  setSelectedTheme(e.target.value);
                  setSelectedSubThemes([]);
                }}
              >
                <MenuItem value="">Select Primary Theme</MenuItem>
                {themes.map((theme) => (
                  <MenuItem key={theme.theme_id} value={theme.theme_id}>{theme.theme_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sub Themes */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, color: "#475569" }}>
              2. Sub-Themes
            </Typography>
            {!selectedTheme ? (
              <Alert severity="warning" size="small" sx={{ py: 0.5, borderRadius: "8px" }}>
                Please select a Primary Theme first to unlock available sub-themes.
              </Alert>
            ) : (
              <Box>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>-- Choose Sub Theme --</InputLabel>
                  <Select onChange={handleAddSubTheme} value="" label="-- Choose Sub Theme --">
                    <MenuItem value="">-- Choose Sub Theme --</MenuItem>
                    {availableSubThemes.map((st) => (
                      <MenuItem key={st.sub_theme_id} value={st.sub_theme_id}>{st.sub_theme_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selectedSubThemes.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "#94a3b8", fontStyle: "italic" }}>No sub-themes linked.</Typography>
                  ) : (
                    selectedSubThemes.map((stId) => {
                      const st = subThemes.find(x => x.sub_theme_id === stId);
                      return st ? (
                        <Chip
                          key={stId}
                          label={st.sub_theme_name}
                          onDelete={() => handleRemoveSubTheme(stId)}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: "500" }}
                        />
                      ) : null;
                    })
                  )}
                </Box>
              </Box>
            )}
          </Grid>

          {/* Target Groups */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, color: "#475569" }}>
              3. Target Groups (Beneficiaries)
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>-- Choose Target Group --</InputLabel>
              <Select onChange={handleAddTargetGroup} value="" label="-- Choose Target Group --">
                <MenuItem value="">-- Choose Target Group --</MenuItem>
                {availableTargetGroups.map((tg) => (
                  <MenuItem key={tg.target_group_id} value={tg.target_group_id}>
                    {tg.main_group} - {tg.sub_group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {selectedTargetGroups.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#94a3b8", fontStyle: "italic" }}>No target groups linked.</Typography>
              ) : (
                selectedTargetGroups.map((tgId) => {
                  const tg = targetGroups.find(x => x.target_group_id === tgId);
                  return tg ? (
                    <Chip
                      key={tgId}
                      label={`${tg.main_group} - ${tg.sub_group}`}
                      onDelete={() => handleRemoveTargetGroup(tgId)}
                      color="secondary"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: "500" }}
                    />
                  ) : null;
                })
              )}
            </Box>
          </Grid>

          {/* Activity Types */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, color: "#475569" }}>
              4. Activity Types
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>-- Choose Activity Type --</InputLabel>
              <Select onChange={handleAddActivityType} value="" label="-- Choose Activity Type --">
                <MenuItem value="">-- Choose Activity Type --</MenuItem>
                {availableActivityTypes.map((at) => (
                  <MenuItem key={at.activity_type_id} value={at.activity_type_id}>{at.activity_type_name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {selectedActivityTypes.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#94a3b8", fontStyle: "italic" }}>No activity types linked.</Typography>
              ) : (
                selectedActivityTypes.map((atId) => {
                  const at = activityTypes.find(x => x.activity_type_id === atId);
                  return at ? (
                    <Chip
                      key={atId}
                      label={at.activity_type_name}
                      onDelete={() => handleRemoveActivityType(atId)}
                      color="info"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: "500" }}
                    />
                  ) : null;
                })
              )}
            </Box>
          </Grid>

          {/* Save Button */}
          <Grid item xs={12} sx={{ mt: 2 }}>
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