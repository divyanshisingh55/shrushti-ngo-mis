import { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Grid, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip
} from "@mui/material";
import {
  Block as DisableIcon,
  CheckCircle as EnableIcon,
  Delete as DeleteIcon,
  VpnKey as ResetPwIcon,
  Visibility as ViewIcon,
  AdminPanelSettings as AdminIcon
} from "@mui/icons-material";
import api from "../services/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [logsDialog, setLogsDialog] = useState(false);
  const [resetPwDialog, setResetPwDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/stats")
      ]);
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (user) => {
    const newStatus = user.account_status === "active" ? "disabled" : "active";
    try {
      await api.patch(`/admin/users/${user.user_id}/status`, { status: newStatus });
      setActionMsg({ type: "success", text: `User ${newStatus === "active" ? "enabled" : "disabled"}.` });
      fetchAll();
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.message || "Action failed." });
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setActionMsg({ type: "success", text: "Role updated." });
      fetchAll();
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.message || "Role update failed." });
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.full_name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.user_id}`);
      setActionMsg({ type: "success", text: "User deleted." });
      fetchAll();
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.message || "Delete failed." });
    }
  };

  const handleViewLogs = async (user) => {
    setSelectedUser(user);
    try {
      const res = await api.get(`/admin/users/${user.user_id}`);
      setUserLogs(res.data.loginHistory || []);
    } catch {
      setUserLogs([]);
    }
    setLogsDialog(true);
  };

  const handleResetPassword = async () => {
    try {
      await api.post(`/admin/users/${selectedUser.user_id}/reset-password`, { newPassword });
      setActionMsg({ type: "success", text: "Password reset successfully." });
      setResetPwDialog(false);
      setNewPassword("");
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.message || "Reset failed." });
    }
  };

  const roleColor = (role) => {
    if (role === "Admin" || role === "Founder") return "error";
    if (role === "User") return "primary";
    return "default";
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <AdminIcon sx={{ color: "#0d9488", fontSize: 32 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#0d9488" }}>
            Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            User management, login history, and system overview.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {actionMsg.text && (
        <Alert severity={actionMsg.type} sx={{ mb: 2 }} onClose={() => setActionMsg({ type: "", text: "" })}>
          {actionMsg.text}
        </Alert>
      )}

      {/* Stats */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total Users", value: stats.stats.total_users, color: "#0d9488" },
            { label: "Active Users", value: stats.stats.active_users, color: "#10b981" },
            { label: "Disabled Users", value: stats.stats.disabled_users, color: "#ef4444" },
            { label: "Total Logins", value: stats.stats.total_logins, color: "#3b82f6" },
            { label: "Failed Logins", value: stats.stats.failed_logins, color: "#f59e0b" }
          ].map(({ label, value, color }) => (
            <Grid item xs={6} sm={4} md={2.4} key={label}>
              <Card sx={{ borderRadius: 3, textAlign: "center", p: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color }}>{value}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Users Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Registered Users ({users.length})</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: "#0d9488", width: 32, height: 32, fontSize: 13 }}>
                          {u.full_name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.full_name}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>{u.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 90 }}>
                        <Select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                          sx={{ fontSize: 12, borderRadius: 2 }}
                        >
                          {["User", "Admin", "Viewer", "Founder"].map(r => (
                            <MenuItem key={r} value={r}>{r}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.account_status}
                        color={u.account_status === "active" ? "success" : "error"}
                        size="small"
                        sx={{ borderRadius: 1, fontWeight: 600, textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {u.last_login ? new Date(u.last_login).toLocaleString("en-IN") : "Never"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(u.created_at).toLocaleDateString("en-IN")}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        <Tooltip title="Login History">
                          <IconButton size="small" onClick={() => handleViewLogs(u)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton size="small" onClick={() => { setSelectedUser(u); setResetPwDialog(true); }}>
                            <ResetPwIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={u.account_status === "active" ? "Disable" : "Enable"}>
                          <IconButton size="small" onClick={() => handleStatusToggle(u)}
                            color={u.account_status === "active" ? "warning" : "success"}>
                            {u.account_status === "active" ? <DisableIcon fontSize="small" /> : <EnableIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton size="small" color="error" onClick={() => handleDelete(u)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Login History Dialog */}
      <Dialog open={logsDialog} onClose={() => setLogsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Login History — {selectedUser?.full_name}</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center">No login history found.</TableCell></TableRow>
                ) : userLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>{new Date(log.login_time).toLocaleString("en-IN")}</TableCell>
                    <TableCell>{log.ip_address || "—"}</TableCell>
                    <TableCell>
                      <Chip label={log.success ? "Success" : "Failed"}
                        color={log.success ? "success" : "error"} size="small" />
                    </TableCell>
                    <TableCell>{log.failure_reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwDialog} onClose={() => setResetPwDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password — {selectedUser?.full_name}</DialogTitle>
        <DialogContent>
          <TextField
            label="New Password" type="password" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth sx={{ mt: 2 }} size="small" autoFocus
            helperText="Minimum 8 characters"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPwDialog(false)}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained" disabled={newPassword.length < 8}>
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
