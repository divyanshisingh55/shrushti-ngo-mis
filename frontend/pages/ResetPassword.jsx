import { useState } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import api from "../services/api";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Link,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import { CheckCircle as CheckIcon, Cancel as CrossIcon } from "@mui/icons-material";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Complexity states
  const hasMinLen = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password);

  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasDigit && hasSymbol;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing from URL.");
      return;
    }
    if (!isPasswordValid) {
      setError("Please satisfy all password complexity requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/auth/reset-password", { token, newPassword: password });
      setSuccess(res.data.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to reset password. Token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const RuleItem = ({ checked, text }) => (
    <ListItem sx={{ py: 0.2, px: 0 }}>
      <ListItemIcon sx={{ minWidth: 28, color: checked ? "#10b981" : "#ef4444" }}>
        {checked ? <CheckIcon fontSize="small" /> : <CrossIcon fontSize="small" />}
      </ListItemIcon>
      <ListItemText
        primary={text}
        primaryTypographyProps={{ fontSize: "12px", color: checked ? "text.primary" : "text.secondary" }}
      />
    </ListItem>
  );

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "85vh", px: 2 }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: "440px", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)" }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#0d9488", mb: 1 }}>
            Set New Password
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Configure your new secure account access credentials
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: "8px" }}>
            {success}
          </Alert>
        )}

        {!token ? (
          <Alert severity="warning" sx={{ borderRadius: "8px" }}>
            Invalid or missing password reset token. Please request a new link from the forgot password page.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                variant="outlined"
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <List sx={{ pt: 0, pb: 1 }}>
                <RuleItem checked={hasMinLen} text="At least 6 characters" />
                <RuleItem checked={hasUpper} text="Contains uppercase letter" />
                <RuleItem checked={hasLower} text="Contains lowercase letter" />
                <RuleItem checked={hasDigit} text="Contains number" />
                <RuleItem checked={hasSymbol} text="Contains special character (@$!%*?&)" />
              </List>

              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                variant="outlined"
                size="small"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.2,
                  backgroundColor: "#0d9488",
                  "&:hover": { backgroundColor: "#0f766e" },
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  mt: 1
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Reset Password"}
              </Button>
            </Stack>
          </Box>
        )}

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Link component={RouterLink} to="/login" sx={{ color: "#0d9488", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
            Go to Login
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
