import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      
      // Store token and user details in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Redirect to main portal dashboard
      navigate("/dashboard");
      window.location.reload(); // Refresh to reload auth state globally
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", px: 2 }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: "420px", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)" }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#0d9488", mb: 1 }}>
            Shrushti MIS Portal
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Sign in to access the NGO dashboard
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }} onClose={() => setError("")}>
            {error}
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
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Link component={RouterLink} to="/forgot-password" sx={{ fontSize: "13px", color: "#0d9488", textDecoration: "none", fontWeight: "600" }}>
                Forgot Password?
              </Link>
            </Box>
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
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Sign In"}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Don't have an account?{" "}
            <Link component={RouterLink} to="/register" sx={{ color: "#0d9488", textDecoration: "none", fontWeight: "600" }}>
              Create Account
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
