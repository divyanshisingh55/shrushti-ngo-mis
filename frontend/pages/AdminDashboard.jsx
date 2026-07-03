import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TablePagination
} from "@mui/material";
import {
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  Language as OnlineIcon,
  ReportProblem as WarnIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CloudDownload as DownloadIcon,
  ManageAccounts as EditIcon
} from "@mui/icons-material";
import api from "../services/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, onlineUsers: 0, failedLogins: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Users Tab
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("");
  const [usersStatusFilter, setUsersStatusFilter] = useState("");

  // Login Logs Tab
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsSuccessFilter, setLogsSuccessFilter] = useState("");
  const [logsCount, setLogsCount] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [logsRowsPerPage, setLogsRowsPerPage] = useState(25);

  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch metrics and user details
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
      showFeedback("error", "Failed to load admin statistics.");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = {};
      if (usersSearch) params.search = usersSearch;
      if (usersRoleFilter) params.role = usersRoleFilter;
      if (usersStatusFilter) params.status = usersStatusFilter;

      const res = await api.get("/admin/users", { params });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      showFeedback("error", "Failed to retrieve user accounts.");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const params = {
        limit: logsRowsPerPage,
        offset: logsPage * logsRowsPerPage
      };
      if (logsSearch) params.search = logsSearch;
      if (logsSuccessFilter) params.success = logsSuccessFilter;

      const res = await api.get("/admin/login-logs", { params });
      setLogs(res.data.logs);
      setLogsCount(res.data.totalCount);
    } catch (err) {
      console.error(err);
      showFeedback("error", "Failed to retrieve login activity logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchUsers();
    } else {
      fetchLogs();
    }
  }, [activeTab, usersRoleFilter, usersStatusFilter, logsSuccessFilter, logsPage, logsRowsPerPage]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 6000);
  };

  // Toggle user state or promote role
  const handleUpdateUser = async (userId, updateFields) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/users/${userId}/status`, updateFields);
      showFeedback("success", res.data.message || "User details updated.");
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(err);
      showFeedback("error", err.response?.data?.message || "Failed to update user status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Export audit logs as CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      showFeedback("error", "No logs available to export.");
      return;
    }

    const headers = [
      "Log ID",
      "User ID",
      "Name",
      "Email Address",
      "Login Time",
      "Logout Time",
      "IP Address",
      "Browser",
      "Operating System",
      "Device Type",
      "Country",
      "Success Status",
      "Failure Reason"
    ];

    const rows = logs.map(log => [
      log.log_id,
      log.user_id || "N/A",
      log.name || "Unknown",
      log.email,
      log.login_time ? new Date(log.login_time).toLocaleString() : "",
      log.logout_time ? new Date(log.logout_time).toLocaleString() : "Active Session",
      log.ip_address,
      log.browser,
      log.os,
      log.device_type,
      log.country,
      log.success ? "SUCCESS" : "FAILED",
      log.failure_reason || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shrushti_login_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "'Playfair Display', serif", fontWeight: "900", color: "#0d9488" }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Manage user accounts, audit login logs, and inspect access logs.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          size="small"
          onClick={() => {
            fetchStats();
            if (activeTab === 0) fetchUsers();
            else fetchLogs();
          }}
          sx={{ borderColor: "#0d9488", color: "#0d9488", textTransform: "none", fontWeight: "bold" }}
        >
          Refresh Panel
        </Button>
      </Box>

      {feedback.message && (
        <Alert severity={feedback.type} sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setFeedback({ type: "", message: "" })}>
          {feedback.message}
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="premium-card" sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}>
            <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", justifyItems: "space-between" }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", textTransform: "uppercase" }}>
                  Total Users
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "800", mt: 0.5, color: "#1e293b" }}>
                  {statsLoading ? <CircularProgress size={24} /> : stats.totalUsers}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "rgba(13, 148, 136, 0.08)", color: "#0d9488", p: 1.5, borderRadius: "12px" }}>
                <PeopleIcon />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="premium-card" sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}>
            <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", justifyItems: "space-between" }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", textTransform: "uppercase" }}>
                  Active Users
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "800", mt: 0.5, color: "#10b981" }}>
                  {statsLoading ? <CircularProgress size={24} /> : stats.activeUsers}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "rgba(16, 185, 129, 0.08)", color: "#10b981", p: 1.5, borderRadius: "12px" }}>
                <ActiveIcon />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="premium-card" sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}>
            <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", justifyItems: "space-between" }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", textTransform: "uppercase" }}>
                  Online Users (15m)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "800", mt: 0.5, color: "#2563eb" }}>
                  {statsLoading ? <CircularProgress size={24} /> : stats.onlineUsers}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "rgba(37, 99, 235, 0.08)", color: "#2563eb", p: 1.5, borderRadius: "12px" }}>
                <OnlineIcon />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="premium-card" sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}>
            <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", justifyItems: "space-between" }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", textTransform: "uppercase" }}>
                  Failed Attempts
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "800", mt: 0.5, color: "#ef4444" }}>
                  {statsLoading ? <CircularProgress size={24} /> : stats.failedLogins}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "rgba(239, 68, 68, 0.08)", color: "#ef4444", p: 1.5, borderRadius: "12px" }}>
                <WarnIcon />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: "100%", borderRadius: "12px", border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => {
            setActiveTab(val);
            setFeedback({ type: "", message: "" });
          }}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            px: 2,
            "& .MuiTab-root": { fontWeight: "bold", textTransform: "none" }
          }}
        >
          <Tab label="User Management" />
          <Tab label="Login Audit History" />
        </Tabs>

        {/* Tab 0: User Management */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Search and Filters */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
              <TextField
                size="small"
                label="Search Users"
                placeholder="Search by name, email..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton size="small" onClick={fetchUsers}>
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                }}
                sx={{ width: { xs: "100%", sm: 280 } }}
              />

              <FormControl size="small" sx={{ width: 140 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={usersRoleFilter}
                  label="Role"
                  onChange={(e) => setUsersRoleFilter(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="Founder">Founder</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Viewer">Viewer</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={usersStatusFilter}
                  label="Status"
                  onChange={(e) => setUsersStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="deactivated">Deactivated</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>User Details</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Job Profile</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Account Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Last Session IP</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Created At</TableCell>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center", py: 4 }}>
                        <CircularProgress size={24} sx={{ mr: 1 }} /> Loading Accounts...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                        No user accounts matched criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((row) => (
                      <TableRow key={row.user_id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={row.profile_photo ? (row.profile_photo.startsWith("http") ? row.profile_photo : `${api.defaults.baseURL}${row.profile_photo}`) : ""} sx={{ width: 36, height: 36, bgcolor: "#0d9488" }}>
                              {row.full_name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: "bold" }}>{row.full_name}</Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{row.email}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.designation || "N/A"}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{row.department || "N/A"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={row.role} size="small" color={row.role === "Founder" ? "primary" : row.role === "Admin" ? "secondary" : "default"} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.account_status} size="small" color={row.account_status === "active" ? "success" : "error"} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.last_login ? new Date(row.last_login).toLocaleString() : "Never"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{new Date(row.created_at).toLocaleDateString()}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                            {/* Role Select Control */}
                            <FormControl size="small" sx={{ width: 100 }} disabled={actionLoading}>
                              <Select
                                value={row.role}
                                onChange={(e) => handleUpdateUser(row.user_id, { role: e.target.value })}
                                sx={{ fontSize: "12px", height: "30px", borderRadius: "6px" }}
                              >
                                <MenuItem value="Founder">Founder</MenuItem>
                                <MenuItem value="Admin">Admin</MenuItem>
                                <MenuItem value="Viewer">Viewer</MenuItem>
                              </Select>
                            </FormControl>
                            
                            {/* Status Activate/Deactivate Toggle */}
                            <Button
                              variant="outlined"
                              size="small"
                              disabled={actionLoading}
                              color={row.account_status === "active" ? "error" : "success"}
                              onClick={() => handleUpdateUser(row.user_id, { status: row.account_status === "active" ? "deactivated" : "active" })}
                              sx={{ fontSize: "11px", py: 0.5, minWidth: 80, textTransform: "none", height: "30px", borderRadius: "6px" }}
                            >
                              {row.account_status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 1: Login logs Audit */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2, mb: 3 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <TextField
                  size="small"
                  label="Search Logs"
                  placeholder="Search by name, email, IP..."
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <IconButton size="small" onClick={fetchLogs}>
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      )
                    }
                  }}
                  sx={{ width: { xs: "100%", sm: 280 } }}
                />

                <FormControl size="small" sx={{ width: 140 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={logsSuccessFilter}
                    label="Status"
                    onChange={(e) => setLogsSuccessFilter(e.target.value)}
                  >
                    <MenuItem value="">All Attempts</MenuItem>
                    <MenuItem value="true">Success Only</MenuItem>
                    <MenuItem value="false">Failures Only</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{ textTransform: "none", fontWeight: "bold" }}
              >
                Export History (CSV)
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>User Details</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Access Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>IP Address</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Device & Agent</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Audit Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Failure/Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center", py: 4 }}>
                        <CircularProgress size={24} sx={{ mr: 1 }} /> Loading Audit Records...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                        No access logs matched parameters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((row) => (
                      <TableRow key={row.log_id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>{row.name || "Guest Login"}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{row.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{new Date(row.login_time).toLocaleString()}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {row.logout_time ? `Duration: ${Math.round((new Date(row.logout_time) - new Date(row.login_time)) / 1000 / 60)} mins` : "Active / Session Ended"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.ip_address}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={row.country} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{row.os} ({row.device_type})</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{row.browser}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.success ? "Success" : "Failed"}
                            size="small"
                            color={row.success ? "success" : "error"}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: row.success ? "text.secondary" : "error.main", fontWeight: row.success ? 400 : 600 }}>
                            {row.success ? "Login Verified" : row.failure_reason}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={logsCount}
              page={logsPage}
              onPageChange={(e, newPage) => setLogsPage(newPage)}
              rowsPerPage={logsRowsPerPage}
              onRowsPerPageChange={(e) => {
                setLogsRowsPerPage(parseInt(e.target.value, 10));
                setLogsPage(0);
              }}
              rowsPerPageOptions={[25, 50, 100]}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
