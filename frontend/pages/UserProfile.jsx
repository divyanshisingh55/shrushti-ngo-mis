import { useState, useEffect } from "react";
import api from "../services/api";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from "@mui/material";
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  PhotoCamera as PhotoIcon,
  Key as KeyIcon,
  Devices as DevicesIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon
} from "@mui/icons-material";

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // User Profile States
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");

  // Password Update States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sessions list
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Settings
  const [themePreference, setThemePreference] = useState("light");
  const [languagePreference, setLanguagePreference] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Image Upload Dialog
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Password strength checks
  const hasMinLen = newPassword.length >= 6;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSymbol = /[@$!%*?&]/.test(newPassword);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasDigit && hasSymbol;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/profile");
      const data = res.data;
      setProfile(data);
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setDesignation(data.designation || "");
      setDepartment(data.department || "");
      
      // Load settings
      const settings = data.settings || {};
      setThemePreference(settings.theme || "light");
      setLanguagePreference(settings.language || "en");
      setTimezone(settings.timezone || "UTC");
      setEmailAlerts(settings.emailAlerts !== undefined ? settings.emailAlerts : true);
      setWeeklyDigest(settings.weeklyDigest !== undefined ? settings.weeklyDigest : false);

      // Load sessions
      fetchSessions();
    } catch (err) {
      console.error(err);
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get("/profile/sessions");
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/profile", {
        fullName,
        phone,
        designation,
        department,
        settings: {
          theme: themePreference,
          language: languagePreference,
          timezone,
          emailAlerts,
          weeklyDigest
        }
      });
      setSuccess("Profile details updated successfully.");
      
      // Update local storage user information
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...localUser,
        fullName,
        designation,
        department
      }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Maximum image size is 2MB.");
        return;
      }
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setUploadDialogOpen(true);
    }
  };

  const handlePhotoUpload = async () => {
    if (!uploadFile) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("photo", uploadFile);

      const res = await api.post("/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Update profile view & local storage
      setProfile(prev => ({ ...prev, profile_photo: res.data.photoUrl }));
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...localUser,
        profilePhoto: res.data.photoUrl
      }));

      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadPreview("");
      setSuccess("Profile photo updated successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to upload profile photo.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please satisfy all password complexity requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/profile/password", {
        currentPassword,
        newPassword
      });
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSessions = async (revokeAll) => {
    if (!window.confirm(revokeAll ? "Are you sure you want to log out from all devices?" : "Are you sure you want to log out from all other devices?")) {
      return;
    }

    try {
      await api.delete("/profile/sessions", { data: { revokeAll } });
      if (revokeAll) {
        // Log out locally
        localStorage.clear();
        api.post("/auth/logout").catch(() => {});
        window.location.href = "/login";
      } else {
        fetchSessions();
        setSuccess("Other sessions revoked successfully.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to revoke session tokens.");
    }
  };

  const RuleItem = ({ checked, text }) => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: checked ? "#10b981" : "#ef4444", fontSize: "12px" }}>
      {checked ? <CheckIcon fontSize="inherit" /> : <CrossIcon fontSize="inherit" />}
      <Typography variant="caption" sx={{ color: checked ? "text.primary" : "text.secondary" }}>
        {text}
      </Typography>
    </Stack>
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress size={45} sx={{ color: "#0d9488" }} />
      </Box>
    );
  }

  // Managers, Admin, or Founder roles can modify settings
  const isManager = profile?.role === "Admin" || profile?.role === "Founder" || profile?.role === "Super Admin";

  return (
    <Box sx={{ flexGrow: 1, p: 1, maxWidth: "1000px", mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "text.primary", mb: 1 }}>
          Account Settings
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Manage your enterprise profile, security attributes, settings and session details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: "8px" }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Navigation Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ borderRadius: "12px", overflow: "hidden" }}>
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              sx={{
                borderRight: 1,
                borderColor: "divider",
                "& .MuiTab-root": {
                  alignItems: "flex-start",
                  textTransform: "none",
                  fontWeight: "bold",
                  py: 2,
                  px: 3
                },
                "& .Mui-selected": {
                  color: "#0d9488 !important"
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#0d9488"
                }
              }}
            >
              <Tab icon={<PersonIcon sx={{ mr: 1 }} />} iconPosition="start" label="Profile Info" />
              <Tab icon={<SecurityIcon sx={{ mr: 1 }} />} iconPosition="start" label="Security & Sessions" />
              <Tab icon={<SettingsIcon sx={{ mr: 1 }} />} iconPosition="start" label="Account Preferences" />
            </Tabs>
          </Paper>
        </Grid>

        {/* Tab Contents */}
        <Grid item xs={12} md={9}>
          {/* TAB 0: Profile Info */}
          {activeTab === 0 && (
            <Paper sx={{ p: 4, borderRadius: "12px" }}>
              <Box component="form" onSubmit={handleUpdateProfile}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                  Profile Information
                </Typography>

                {/* Profile Photo Upload */}
                <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
                  <Avatar
                    src={profile?.profile_photo ? (profile.profile_photo.startsWith("http") ? profile.profile_photo : `http://localhost:5000${profile.profile_photo}`) : ""}
                    sx={{ width: 84, height: 84, fontSize: "32px", bgcolor: "#0d9488" }}
                  >
                    {profile?.full_name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<PhotoIcon />}
                      size="small"
                      sx={{ textTransform: "none", fontWeight: "bold", borderColor: "#0d9488", color: "#0d9488" }}
                    >
                      Change Photo
                      <input type="file" hidden accept="image/*" onChange={handlePhotoSelect} />
                    </Button>
                    <Typography variant="caption" display="block" sx={{ color: "text.secondary", mt: 1 }}>
                      JPG, PNG, GIF up to 2MB allowed
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      size="small"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address (Read-only)"
                      size="small"
                      value={profile?.email || ""}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      size="small"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Employee ID (Read-only)"
                      size="small"
                      value={profile?.employee_id || "Not Assigned"}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Designation"
                      size="small"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      disabled={!isManager}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Department"
                      size="small"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={!isManager}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="RBAC Role (Read-only)"
                      size="small"
                      value={profile?.role || ""}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Verification Status"
                      size="small"
                      value={profile?.email_verified ? "Verified" : "Pending"}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      sx={{
                        backgroundColor: "#0d9488",
                        "&:hover": { backgroundColor: "#0f766e" },
                        textTransform: "none",
                        fontWeight: "bold",
                        borderRadius: "8px",
                        px: 4
                      }}
                    >
                      {saving ? <CircularProgress size={24} /> : "Save Profile Details"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          )}

          {/* TAB 1: Security & Sessions */}
          {activeTab === 1 && (
            <Stack spacing={3}>
              {/* Change Password Card */}
              <Paper sx={{ p: 4, borderRadius: "12px" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                  Change Password
                </Typography>
                <Box component="form" onSubmit={handleChangePassword}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        type="password"
                        size="small"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        size="small"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        <RuleItem checked={hasMinLen} text="Min 6 characters" />
                        <RuleItem checked={hasUpper} text="Uppercase letter" />
                        <RuleItem checked={hasLower} text="Lowercase letter" />
                        <RuleItem checked={hasDigit} text="Number" />
                        <RuleItem checked={hasSymbol} text="Special character (@$!%*?&)" />
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        size="small"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={saving || !isPasswordValid || password !== confirmPassword}
                        sx={{
                          backgroundColor: "#0d9488",
                          "&:hover": { backgroundColor: "#0f766e" },
                          textTransform: "none",
                          fontWeight: "bold",
                          borderRadius: "8px",
                          px: 4
                        }}
                      >
                        Change Password
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              {/* Active Sessions Card */}
              <Paper sx={{ p: 4, borderRadius: "12px" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Active Login Sessions
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      These are the devices currently logged into your account.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    sx={{ textTransform: "none", fontWeight: "bold" }}
                    onClick={() => handleRevokeSessions(false)}
                  >
                    Logout from Other Devices
                  </Button>
                </Box>

                {sessionsLoading ? (
                  <CircularProgress size={30} />
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>Device / OS</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Browser</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>IP Address</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Last Active</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sessions.map((s) => (
                          <TableRow key={s.session_id}>
                            <TableCell>{s.device} ({s.os})</TableCell>
                            <TableCell>{s.browser}</TableCell>
                            <TableCell>{s.ip}</TableCell>
                            <TableCell>{new Date(s.last_active).toLocaleString()}</TableCell>
                            <TableCell>
                              {s.is_current ? (
                                <Chip label="Current" color="success" size="small" sx={{ fontWeight: "bold" }} />
                              ) : (
                                <Chip label="Active" color="primary" size="small" variant="outlined" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Stack>
          )}

          {/* TAB 2: Account Preferences */}
          {activeTab === 2 && (
            <Paper sx={{ p: 4, borderRadius: "12px" }}>
              <Box component="form" onSubmit={handleUpdateProfile}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                  Preferences & Settings
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Theme Mode</InputLabel>
                      <Select
                        value={themePreference}
                        label="Theme Mode"
                        onChange={(e) => setThemePreference(e.target.value)}
                      >
                        <MenuItem value="light">Light Mode (Default)</MenuItem>
                        <MenuItem value="dark">Dark Mode</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Portal Language</InputLabel>
                      <Select
                        value={languagePreference}
                        label="Portal Language"
                        onChange={(e) => setLanguagePreference(e.target.value)}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="hi">Hindi (हिंदी)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Timezone</InputLabel>
                      <Select
                        value={timezone}
                        label="Timezone"
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        <MenuItem value="UTC">UTC / Coordinated Universal Time</MenuItem>
                        <MenuItem value="Asia/Kolkata">IST / Indian Standard Time (Asia/Kolkata)</MenuItem>
                        <MenuItem value="America/New_York">EST / Eastern Time (America/New_York)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, mt: 1 }}>
                      Notification Rules
                    </Typography>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={emailAlerts}
                            onChange={(e) => setEmailAlerts(e.target.checked)}
                            sx={{ color: "#0d9488", "&.Mui-checked": { color: "#0d9488" } }}
                          />
                        }
                        label="Send me immediate email alerts for data updates or modifications"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={weeklyDigest}
                            onChange={(e) => setWeeklyDigest(e.target.checked)}
                            sx={{ color: "#0d9488", "&.Mui-checked": { color: "#0d9488" } }}
                          />
                        }
                        label="Send me a weekly analytical summary digest report"
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      sx={{
                        backgroundColor: "#0d9488",
                        "&:hover": { backgroundColor: "#0f766e" },
                        textTransform: "none",
                        fontWeight: "bold",
                        borderRadius: "8px",
                        px: 4
                      }}
                    >
                      {saving ? <CircularProgress size={24} /> : "Save Preferences"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Upload Photo Modal */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Verify Profile Photo</DialogTitle>
        <DialogContent sx={{ minWidth: 320, textAlign: "center" }}>
          {uploadPreview && (
            <Avatar
              src={uploadPreview}
              sx={{ width: 140, height: 140, mx: "auto", border: "4px solid", borderColor: "divider", my: 2 }}
            />
          )}
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Is this profile picture correct? You can crop and verify here before uploading.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={() => setUploadDialogOpen(false)} sx={{ textTransform: "none", fontWeight: "bold" }}>
            Cancel
          </Button>
          <Button
            onClick={handlePhotoUpload}
            variant="contained"
            disabled={saving}
            sx={{ backgroundColor: "#0d9488", "&:hover": { backgroundColor: "#0f766e" }, textTransform: "none", fontWeight: "bold" }}
          >
            {saving ? <CircularProgress size={20} /> : "Upload Image"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
