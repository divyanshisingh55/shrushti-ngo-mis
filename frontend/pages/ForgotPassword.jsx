import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  Stack
} from "@mui/material";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSuccess(res.data.message);
      setEmail("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", px: 2 }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: "420px", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)" }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#0d9488", mb: 1 }}>
            Recover Password
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Enter your email to receive a password reset link
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

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              variant="outlined"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                borderRadius: "8px"
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Send Reset Link"}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Link component={RouterLink} to="/login" sx={{ color: "#0d9488", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
            Back to Login
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
