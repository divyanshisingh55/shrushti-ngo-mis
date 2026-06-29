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
  const [docNo, setDocNo] = useState("");
  const [year, setYear] = useState("");
  const [approvalDate, setApprovalDate] = useState("");
  const [sanctionedAmount, setSanctionedAmount] = useState("");
  const [statusId, setStatusId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [donorAgencyName, setDonorAgencyName] = useState("");
  const [donorCategory, setDonorCategory] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [district, setDistrict] = useState("");
  const [blockVillageUlb, setBlockVillageUlb] = useState("");

  // Metadata selectors
  const [agencySelect, setAgencySelect] = useState("");
  const [customAgency, setCustomAgency] = useState("");
  const [fundingSelect, setFundingSelect] = useState("");
  const [customFunding, setCustomFunding] = useState("");
  const [fundingSelect2, setFundingSelect2] = useState("");
  const [customFunding2, setCustomFunding2] = useState("");
  const [selectedStates, setSelectedStates] = useState([{ state_id: "", custom_name: "" }]);

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
      setStatuses(statusesRes.data.filter(s => s.status_name === 'Pending' || s.status_name === 'Ongoing'));
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
      setError("Donor Agency is required.");
      return;
    }

    if (!year.trim()) {
      setError("Financial Year is required.");
      return;
    }

    const fundingVal = fundingSelect === "custom" ? customFunding : fundingSelect;
    const fundingVal2 = fundingSelect2 === "custom" ? customFunding2 : fundingSelect2;

    // Resolve states array
    const resolvedStates = selectedStates.map(stObj => {
      return stObj.state_id === "custom" ? stObj.custom_name : stObj.state_id;
    }).filter(Boolean);

    if (resolvedStates.length === 0) {
      setError("At least one State is required.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/projects", {
        project_name: projectName,
        agency: agencyVal,
        year: year,
        funding_source: fundingVal,
        funding_source2: fundingVal2,
        approval_date: approvalDate || null,
        sanctioned_amount: sanctionedAmount || null,
        status_id: statusId || null,
        state: resolvedStates,
        remarks: remarks,
        funding_type: fundingType || null,
        donor_agency_name: donorAgencyName || null,
        donor_category: donorCategory || null,
        duration_months: durationMonths ? Number(durationMonths) : null,
        district: district || null,
        block_village_ulb: blockVillageUlb || null,
        doc_no: docNo || null
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
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "text.primary", mb: 1 }}>
          Add New Project
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
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
            {/* Project Basic Details Section */}
            <Grid size={12}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1e293b", mb: 1, borderBottom: "2px solid #f1f5f9", pb: 1 }}>
                1. Basic Project Details
              </Typography>
            </Grid>

            {/* Project Name (Width 8) */}
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                label="Project Name"
                required
                variant="outlined"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </Grid>

            {/* Doc Number (Width 4) */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Document Number / Doc No."
                variant="outlined"
                value={docNo}
                onChange={(e) => setDocNo(e.target.value)}
              />
            </Grid>

            {/* Donor Agency (Full Width) */}
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Donor Agency</InputLabel>
                <Select
                  value={agencySelect}
                  label="Donor Agency"
                  onChange={(e) => setAgencySelect(e.target.value)}
                >
                  <MenuItem value="">Select Donor Agency</MenuItem>
                  {agencies.map((a) => (
                    <MenuItem key={a.agency_id} value={a.agency_id}>{a.agency_name}</MenuItem>
                  ))}
                  <MenuItem value="custom" sx={{ fontStyle: "italic", color: "#2563eb", fontWeight: "bold" }}>
                    + Add New Donor Agency
                  </MenuItem>
                </Select>
              </FormControl>
              {agencySelect === "custom" && (
                <TextField
                  fullWidth
                  label="Enter New Donor Agency Name"
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
            <Grid size={{ xs: 12, sm: 4 }}>
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

            {/* Date of Approval (Normal Width with proper DatePicker component) */}
            <Grid size={{ xs: 12, sm: 4 }}>
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
            <Grid size={{ xs: 12, sm: 4 }}>
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

            {/* Duration (Months) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Duration (in Months)"
                type="number"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
              />
            </Grid>

            {/* Funding details section */}
            <Grid size={12}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1e293b", mt: 2, mb: 1, borderBottom: "2px solid #f1f5f9", pb: 1 }}>
                2. Funding & Donor Details
              </Typography>
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

            {/* Funding Source 2 (Normal Width) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Funding Source 2</InputLabel>
                <Select
                  value={fundingSelect2}
                  label="Funding Source 2"
                  onChange={(e) => setFundingSelect2(e.target.value)}
                >
                  <MenuItem value="">Select Funding Source 2</MenuItem>
                  {fundingSources.map((f) => (
                    <MenuItem key={f.funding_source_id} value={f.funding_source_id}>{f.source_name}</MenuItem>
                  ))}
                  <MenuItem value="custom" sx={{ fontStyle: "italic", color: "#2563eb", fontWeight: "bold" }}>
                    + Add New Funding Source 2
                  </MenuItem>
                </Select>
              </FormControl>
              {fundingSelect2 === "custom" && (
                <TextField
                  fullWidth
                  label="Enter New Funding Source 2"
                  required
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  value={customFunding2}
                  onChange={(e) => setCustomFunding2(e.target.value)}
                />
              )}
            </Grid>

            {/* Funding Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Funding Type</InputLabel>
                <Select
                  value={fundingType}
                  label="Funding Type"
                  onChange={(e) => setFundingType(e.target.value)}
                >
                  <MenuItem value="">Select Funding Type</MenuItem>
                  {["Grant", "Donation", "CSR", "Government", "Other"].map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Donor Agency Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Donor Agency Name"
                value={donorAgencyName}
                onChange={(e) => setDonorAgencyName(e.target.value)}
              />
            </Grid>

            {/* Donor Category */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Donor Category</InputLabel>
                <Select
                  value={donorCategory}
                  label="Donor Category"
                  onChange={(e) => setDonorCategory(e.target.value)}
                >
                  <MenuItem value="">Select Donor Category</MenuItem>
                  {["Corporate", "Individual", "Trust/Foundation", "Government Agency", "International Donor", "Other"].map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Geography section */}
            <Grid size={12}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1e293b", mt: 2, mb: 1, borderBottom: "2px solid #f1f5f9", pb: 1 }}>
                3. Geography
              </Typography>
            </Grid>

            {/* State (Multiple Selection) */}
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
                        <MenuItem value="custom" sx={{ fontStyle: "italic", color: "#2563eb", fontWeight: "bold" }}>
                          + Add New State
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    {stObj.state_id === "custom" && (
                      <TextField
                        fullWidth
                        label="Enter New State Name"
                        required
                        variant="outlined"
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

            {/* District */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </Grid>

            {/* Block/Village/ULB */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Block / Village / ULB"
                value={blockVillageUlb}
                onChange={(e) => setBlockVillageUlb(e.target.value)}
              />
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
