import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Stack
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

export default function AddProject() {
  const navigate = useNavigate();

  // Form states
  const [projectName, setProjectName] = useState("");
  const [year, setYear] = useState("");
  const [approvalDate, setApprovalDate] = useState("");
  const [sanctionedAmount, setSanctionedAmount] = useState("");
  const [statusId, setStatusId] = useState("");
  const [remarks, setRemarks] = useState("");

  // Metadata selectors
  const [agencySelect, setAgencySelect] = useState("");
  const [customAgency, setCustomAgency] = useState("");
  const [fundingSelect, setFundingSelect] = useState("");
  const [customFunding, setCustomFunding] = useState("");
  const [stateSelect, setStateSelect] = useState("");
  const [customState, setCustomState] = useState("");

  // Database lists
  const [agencies, setAgencies] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [states, setStates] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [agenciesRes, fundingRes, statesRes, statusesRes] = await Promise.all([
        axios.get("http://localhost:5000/agencies"),
        axios.get("http://localhost:5000/fundingsources"),
        axios.get("http://localhost:5000/states"),
        axios.get("http://localhost:5000/statuses")
      ]);

      setAgencies(agenciesRes.data);
      setFundingSources(fundingRes.data);
      setStates(statesRes.data);
      setStatuses(statusesRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading dropdown data:", err);
      setError("Failed to load metadata lists. Please refresh.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 7. Validation: Project Name, Agency, and Financial Year are required.
    if (!projectName.trim()) {
      setError("Project Name is required.");
      return;
    }

    const agencyVal = agencySelect === "custom" ? customAgency : agencySelect;
    if (!agencyVal || !agencyVal.toString().trim()) {
      setError("Agency is required.");
      return;
    }

    if (!year.trim()) {
      setError("Financial Year is required.");
      return;
    }

    const fundingVal = fundingSelect === "custom" ? customFunding : fundingSelect;
    const stateVal = stateSelect === "custom" ? customState : stateSelect;

    try {
      await axios.post("http://localhost:5000/projects", {
        project_name: projectName,
        agency: agencyVal,
        year: year,
        funding_source: fundingVal,
        approval_date: approvalDate || null,
        sanctioned_amount: sanctionedAmount || null,
        status_id: statusId || null,
        state: stateVal,
        remarks: remarks
      });

      alert("Project added successfully!");
      navigate("/projects");
    } catch (err) {
      console.error("Error adding project:", err);
      setError(err.response?.data?.message || err.message);
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
    <Box sx={{ flexGrow: 1, p: 1, maxWidth: "900px", mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}>
          Add New Project
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Create a new project record in the NGO MIS. Once saved, it will appear in the Projects List and the Classification Queue.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Project Name (Full Width) */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="Project Name"
                required
                variant="outlined"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </Grid>

            {/* Agency (Full Width) */}
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Agency</InputLabel>
                <Select
                  value={agencySelect}
                  label="Agency"
                  onChange={(e) => setAgencySelect(e.target.value)}
                >
                  <MenuItem value="">Select Agency</MenuItem>
                  {agencies.map((a) => (
                    <MenuItem key={a.agency_id} value={a.agency_id}>{a.agency_name}</MenuItem>
                  ))}
                  <MenuItem value="custom" sx={{ fontStyle: "italic", color: "#2563eb", fontWeight: "bold" }}>
                    + Add New Agency
                  </MenuItem>
                </Select>
              </FormControl>
              {agencySelect === "custom" && (
                <TextField
                  fullWidth
                  label="Enter New Agency Name"
                  required
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  value={customAgency}
                  onChange={(e) => setCustomAgency(e.target.value)}
                />
              )}
            </Grid>

            {/* Financial Year (Normal Width) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Financial Year (e.g. 2024-25)"
                required
                variant="outlined"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2024-25"
              />
            </Grid>

            {/* Funding Source (Normal Width) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Funding Source</InputLabel>
                <Select
                  value={fundingSelect}
                  label="Funding Source"
                  onChange={(e) => setFundingSelect(e.target.value)}
                >
                  <MenuItem value="">Select Funding Source</MenuItem>
                  {fundingSources.map((f) => (
                    <MenuItem key={f.funding_source_id} value={f.funding_source_id}>{f.source_name}</MenuItem>
                  ))}
                  <MenuItem value="custom" sx={{ fontStyle: "italic", color: "#2563eb", fontWeight: "bold" }}>
                    + Add New Funding Source
                  </MenuItem>
                </Select>
              </FormControl>
              {fundingSelect === "custom" && (
                <TextField
                  fullWidth
                  label="Enter New Funding Source"
                  required
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  value={customFunding}
                  onChange={(e) => setCustomFunding(e.target.value)}
                />
              )}
            </Grid>

            {/* State (Normal Width) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={stateSelect}
                  label="State"
                  onChange={(e) => setStateSelect(e.target.value)}
                >
                  <MenuItem value="">Select State</MenuItem>
                  {states.map((s) => (
                    <MenuItem key={s.state_id} value={s.state_id}>{s.state_name}</MenuItem>
                  ))}
                  <MenuItem value="custom" sx={{ fontStyle: "italic", color: "#2563eb", fontWeight: "bold" }}>
                    + Add New State
                  </MenuItem>
                </Select>
              </FormControl>
              {stateSelect === "custom" && (
                <TextField
                  fullWidth
                  label="Enter New State Name"
                  required
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value)}
                />
              )}
            </Grid>

            {/* Date of Approval (Normal Width with proper DatePicker component) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date of Approval"
                  format="DD/MM/YYYY"
                  value={approvalDate ? dayjs(approvalDate) : null}
                  onChange={(newValue) => {
                    setApprovalDate(newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "");
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      placeholder: "DD/MM/YYYY"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Sanctioned Amount (Normal Width) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Sanctioned Amount (Rs.)"
                type="number"
                value={sanctionedAmount}
                onChange={(e) => setSanctionedAmount(e.target.value)}
              />
            </Grid>

            {/* Implementation Status (Normal Width) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Implementation Status</InputLabel>
                <Select
                  value={statusId}
                  label="Implementation Status"
                  onChange={(e) => setStatusId(e.target.value)}
                >
                  <MenuItem value="">Select Status</MenuItem>
                  {statuses.map((s) => (
                    <MenuItem key={s.status_id} value={s.status_id}>{s.status_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Remarks (Full Width Textarea) */}
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarks"
                variant="outlined"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Grid>

            {/* Buttons Panel */}
            <Grid size={12}>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  sx={{ textTransform: "none", fontWeight: "bold", px: 3, py: 1 }}
                >
                  Save Project
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate("/projects")}
                  sx={{ textTransform: "none", fontWeight: "bold", px: 3, py: 1 }}
                >
                  Cancel
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
