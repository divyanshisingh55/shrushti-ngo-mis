import { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Button, Avatar, Divider, Alert, CircularProgress, Chip
} from "@mui/material";
import { Person as PersonIcon, Edit as EditIcon, Save as SaveIcon } from "@mui/icons-material";
import api from "../services/api";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      setForm({
        full_name: res.data.user.full_name || "",
        phone: res.data.user.phone || "",
        designation: res.data.user.designation || "",
        department: res.data.user.department || ""
      });
    } catch {
      setMessage({ type: "error", text: "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/profile/update", form);
      setMessage({ type: "success", text: "Profile updated successfully." });
      setEditing(false);
      fetchProfile();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Update failed." });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    try {
      await api.post("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err.response?.data?.message || "Failed to change password." });
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontFamily: "'Playfair Display', serif", color: "#0d9488" }}>
        Account Settings
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Manage your profile and security settings.
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, textAlign: "center", p: 3 }}>
            <Avatar sx={{ bgcolor: "#0d9488", width: 80, height: 80, fontSize: 32, mx: "auto", mb: 2 }}>
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{user?.full_name}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>{user?.email}</Typography>
            <Chip label={user?.role} color="primary" size="small" sx={{ mt: 1 }} />
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
            </Typography>
          </Card>
        </Grid>

        {/* Edit Profile */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Profile Information</Typography>
                <Button
                  startIcon={editing ? <SaveIcon /> : <EditIcon />}
                  variant={editing ? "contained" : "outlined"}
                  size="small"
                  onClick={editing ? handleSave : () => setEditing(true)}
                  disabled={saving}
                  sx={{ borderRadius: 2 }}
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Edit Profile"}
                </Button>
              </Box>

              <Grid container spacing={2}>
                {[
                  { label: "Full Name", key: "full_name" },
                  { label: "Phone", key: "phone" },
                  { label: "Designation", key: "designation" },
                  { label: "Department", key: "department" }
                ].map(({ label, key }) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <TextField
                      label={label} value={form[key] || ""} fullWidth size="small"
                      disabled={!editing}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <TextField label="Email" value={user?.email || ""} fullWidth size="small" disabled
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Role" value={user?.role || ""} fullWidth size="small" disabled
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card sx={{ borderRadius: 3, mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Change Password</Typography>

              {pwMsg.text && (
                <Alert severity={pwMsg.type} sx={{ mb: 2 }} onClose={() => setPwMsg({ type: "", text: "" })}>
                  {pwMsg.text}
                </Alert>
              )}

              <form onSubmit={handlePasswordChange}>
                <Grid container spacing={2}>
                  {[
                    { label: "Current Password", key: "currentPassword" },
                    { label: "New Password", key: "newPassword" },
                    { label: "Confirm New Password", key: "confirmPassword" }
                  ].map(({ label, key }) => (
                    <Grid item xs={12} key={key}>
                      <TextField
                        label={label} type="password" value={pwForm[key]} fullWidth size="small"
                        onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Button type="submit" variant="contained" sx={{ mt: 2, borderRadius: 2 }}>
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
