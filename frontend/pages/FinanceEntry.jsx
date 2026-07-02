import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  CircularProgress, Alert, Divider, Stack, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Snackbar
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from "@mui/icons-material";

const API = "/finance";

const EMPTY_FORM = {
  year: "",
  income: "",
  expenditure: "",
  surplus: "",
  turnover: "",
  total_assets: "",
  total_liabilities: "",
  networth: "",
  grant_received_total: "",
  grant_received_govt: "",
  grant_received_csr: "",
  grant_received_funding_agency: "",
  grant_received_fcra: "",
  grant_in_aid_total: "",
  grant_in_aid_govt: "",
  grant_in_aid_csr: "",
  grant_in_aid_funding_agency: "",
  grant_in_aid_fcra: "",
};

const formatCrore = (val) => {
  if (!val && val !== 0) return "—";
  const n = Number(val);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
};

const NumField = ({ label, name, value, onChange, helperText, required }) => (
  <TextField
    fullWidth
    label={label}
    name={name}
    type="number"
    value={value}
    onChange={onChange}
    required={required}
    helperText={helperText}
    size="small"
    inputProps={{ step: "0.01" }}
    sx={{ "& input[type=number]": { MozAppearance: "textfield" } }}
  />
);

export default function FinanceEntry() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, record: null });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(API);
      setRecords(res.data.sort((a, b) => b.year.localeCompare(a.year)));
    } catch (err) {
      setError("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate surplus if income and expenditure are present
      if (name === "income" || name === "expenditure") {
        const inc = parseFloat(name === "income" ? value : prev.income) || 0;
        const exp = parseFloat(name === "expenditure" ? value : prev.expenditure) || 0;
        updated.surplus = (inc - exp).toFixed(2);
      }
      // Auto-calculate grant received total
      if (["grant_received_govt", "grant_received_csr", "grant_received_funding_agency", "grant_received_fcra"].includes(name)) {
        const govt = parseFloat(name === "grant_received_govt" ? value : prev.grant_received_govt) || 0;
        const csr = parseFloat(name === "grant_received_csr" ? value : prev.grant_received_csr) || 0;
        const fa = parseFloat(name === "grant_received_funding_agency" ? value : prev.grant_received_funding_agency) || 0;
        const fcra = parseFloat(name === "grant_received_fcra" ? value : prev.grant_received_fcra) || 0;
        updated.grant_received_total = (govt + csr + fa + fcra).toFixed(2);
      }
      // Auto-calculate grant in aid total
      if (["grant_in_aid_govt", "grant_in_aid_csr", "grant_in_aid_funding_agency", "grant_in_aid_fcra"].includes(name)) {
        const govt = parseFloat(name === "grant_in_aid_govt" ? value : prev.grant_in_aid_govt) || 0;
        const csr = parseFloat(name === "grant_in_aid_csr" ? value : prev.grant_in_aid_csr) || 0;
        const fa = parseFloat(name === "grant_in_aid_funding_agency" ? value : prev.grant_in_aid_funding_agency) || 0;
        const fcra = parseFloat(name === "grant_in_aid_fcra" ? value : prev.grant_in_aid_fcra) || 0;
        updated.grant_in_aid_total = (govt + csr + fa + fcra).toFixed(2);
      }
      // Auto-calculate networth
      if (name === "total_assets" || name === "total_liabilities") {
        const assets = parseFloat(name === "total_assets" ? value : prev.total_assets) || 0;
        const liab = parseFloat(name === "total_liabilities" ? value : prev.total_liabilities) || 0;
        updated.networth = (assets - liab).toFixed(2);
      }
      return updated;
    });
  };

  const handleEdit = (record) => {
    setForm({
      year: record.year || "",
      income: record.income || "",
      expenditure: record.expenditure || "",
      surplus: record.surplus || "",
      turnover: record.turnover || "",
      total_assets: record.total_assets || "",
      total_liabilities: record.total_liabilities || "",
      networth: record.networth || "",
      grant_received_total: record.grant_received_total || "",
      grant_received_govt: record.grant_received_govt || "",
      grant_received_csr: record.grant_received_csr || "",
      grant_received_funding_agency: record.grant_received_funding_agency || "",
      grant_received_fcra: record.grant_received_fcra || "",
      grant_in_aid_total: record.grant_in_aid_total || "",
      grant_in_aid_govt: record.grant_in_aid_govt || "",
      grant_in_aid_csr: record.grant_in_aid_csr || "",
      grant_in_aid_funding_agency: record.grant_in_aid_funding_agency || "",
      grant_in_aid_fcra: record.grant_in_aid_fcra || "",
    });
    setEditId(record.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.year.trim()) { setError("Financial Year is required"); return; }
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await api.put(`${API}/${editId}`, form);
        setSnack({ open: true, msg: `Record for ${form.year} updated successfully!`, severity: "success" });
      } else {
        await api.post(API, form);
        setSnack({ open: true, msg: `Record for ${form.year} added successfully!`, severity: "success" });
      }
      await fetchData();
      handleCancel();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.record) return;
    try {
      await api.delete(`${API}/${deleteDialog.record.id}`);
      setSnack({ open: true, msg: `Record for ${deleteDialog.record.year} deleted.`, severity: "info" });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setDeleteDialog({ open: false, record: null });
    }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <CircularProgress sx={{ color: "#0d9488" }} />
    </Box>
  );

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Playfair Display', serif", color: "#0d9488" }}>
            Finance Data Entry
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Add or edit annual financial records — Shrushti Sava Samiti
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {!showForm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
              sx={{ bgcolor: "#0d9488", "&:hover": { bgcolor: "#0f766e" }, borderRadius: 2, fontWeight: 700, textTransform: "none" }}
            >
              Add New Year
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            onClick={() => navigate("/finance")}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", borderColor: "#0d9488", color: "#0d9488" }}
          >
            View Dashboard
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Entry Form */}
      {showForm && (
        <Card elevation={0} sx={{ border: "2px solid #0d9488", borderRadius: 3, mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0d9488" }}>
                {editId ? `✏️ Edit Record — FY ${form.year}` : "➕ Add New Financial Year Record"}
              </Typography>
              <Chip
                label="Totals auto-calculated"
                icon={<InfoIcon />}
                size="small"
                sx={{ bgcolor: "#0d948815", color: "#0d9488" }}
              />
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              {/* Year */}
              <Grid container spacing={2.5}>
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>
                    📅 Financial Year
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    required
                    label="Financial Year"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    placeholder="e.g. 2025-26"
                    size="small"
                    disabled={!!editId}
                    helperText="Format: YYYY-YY (e.g. 2025-26)"
                  />
                </Grid>

                <Grid size={12}><Divider /></Grid>

                {/* Income & Expenditure */}
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>
                    💰 Income & Expenditure (in ₹)
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <NumField label="Income" name="income" value={form.income} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <NumField label="Expenditure" name="expenditure" value={form.expenditure} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <NumField label="Surplus / Deficit (auto)" name="surplus" value={form.surplus} onChange={handleChange} helperText="Auto-calculated from Income − Expenditure" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <NumField label="Turnover" name="turnover" value={form.turnover} onChange={handleChange} />
                </Grid>

                <Grid size={12}><Divider /></Grid>

                {/* Balance Sheet */}
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>
                    🏦 Balance Sheet (in ₹)
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <NumField label="Total Assets" name="total_assets" value={form.total_assets} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <NumField label="Total Liabilities" name="total_liabilities" value={form.total_liabilities} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <NumField label="Networth (auto)" name="networth" value={form.networth} onChange={handleChange} helperText="Auto-calculated from Assets − Liabilities" />
                </Grid>

                <Grid size={12}><Divider /></Grid>

                {/* Grant Received */}
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>
                    🤝 Grant Received (in ₹)
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <NumField label="Government" name="grant_received_govt" value={form.grant_received_govt} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <NumField label="CSR" name="grant_received_csr" value={form.grant_received_csr} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <NumField label="Funding Agency" name="grant_received_funding_agency" value={form.grant_received_funding_agency} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <NumField label="FCRA" name="grant_received_fcra" value={form.grant_received_fcra} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <NumField label="Total Grant Received (auto)" name="grant_received_total" value={form.grant_received_total} onChange={handleChange} helperText="Auto-sum of above 4 sources" />
                </Grid>

                <Grid size={12}><Divider /></Grid>

                {/* Grant in Aid */}
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>
                    🎯 Grant in Aid (in ₹)
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <NumField label="Government" name="grant_in_aid_govt" value={form.grant_in_aid_govt} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <NumField label="CSR" name="grant_in_aid_csr" value={form.grant_in_aid_csr} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <NumField label="Funding Agency" name="grant_in_aid_funding_agency" value={form.grant_in_aid_funding_agency} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <NumField label="FCRA" name="grant_in_aid_fcra" value={form.grant_in_aid_fcra} onChange={handleChange} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <NumField label="Total Grant in Aid (auto)" name="grant_in_aid_total" value={form.grant_in_aid_total} onChange={handleChange} helperText="Auto-sum of above 4 sources" />
                </Grid>

                <Grid size={12}>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <SaveIcon />}
                      disabled={saving}
                      sx={{ bgcolor: "#0d9488", "&:hover": { bgcolor: "#0f766e" }, borderRadius: 2, fontWeight: 700, textTransform: "none", px: 4 }}
                    >
                      {saving ? "Saving…" : editId ? "Update Record" : "Save Record"}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            📋 All Finance Records ({records.length} years)
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "rgba(13,148,136,0.06)" }}>
              <TableRow>
                {["Year", "Income", "Expenditure", "Surplus", "Turnover", "Networth", "Grant Received", "Grant in Aid", "Actions"].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: "#0d9488" }}>{r.year}</TableCell>
                  <TableCell>{formatCrore(r.income)}</TableCell>
                  <TableCell>{formatCrore(r.expenditure)}</TableCell>
                  <TableCell sx={{ color: Number(r.surplus) >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                    {formatCrore(r.surplus)}
                  </TableCell>
                  <TableCell>{formatCrore(r.turnover)}</TableCell>
                  <TableCell sx={{ color: Number(r.networth) >= 0 ? "#3b82f6" : "#ef4444", fontWeight: 600 }}>
                    {formatCrore(r.networth)}
                  </TableCell>
                  <TableCell>{formatCrore(r.grant_received_total)}</TableCell>
                  <TableCell>{formatCrore(r.grant_in_aid_total)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(r)} sx={{ color: "#3b82f6" }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeleteDialog({ open: true, record: r })} sx={{ color: "#ef4444" }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, record: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Record?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the financial record for <strong>FY {deleteDialog.record?.year}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, record: null })} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ textTransform: "none", fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
