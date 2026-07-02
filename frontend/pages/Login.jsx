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
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        px: 2,
        background: "rgba(11, 19, 41, 0.3)",
        backdropFilter: "blur(10px)",
        overflowY: "auto"
      }}
    >
      <Paper
        elevation={24}
        className="premium-card"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          maxWidth: "960px",
          minHeight: "560px",
          borderRadius: "20px",
          overflow: "hidden",
          backgroundColor: (theme) => theme.palette.mode === 'light' ? "rgba(255, 255, 255, 0.88)" : "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(16px)",
          border: "1px solid",
          borderColor: (theme) => theme.palette.mode === 'light' ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.08)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.25)"
        }}
      >
        {/* Left Side: NGO Work Image Banner */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            backgroundImage: "url(/ngo_work.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            minHeight: { xs: "250px", md: "auto" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            p: 4,
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(180deg, rgba(11, 19, 41, 0.1) 0%, rgba(11, 19, 41, 0.85) 100%)",
              zIndex: 1
            }
          }}
        >
          <Box sx={{ position: "relative", zIndex: 2, color: "#ffffff" }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mb: 1,
                fontFamily: "'Playfair Display', serif",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)"
              }}
            >
              Shrushti Seva Samiti
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.85)",
                fontWeight: 500,
                lineHeight: 1.4,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)"
              }}
            >
              Empowering communities, driving rural development, and building a sustainable future.
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Login Form */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            p: { xs: 4, md: 6 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            {/* Shrushti Logo */}
            <Box
              component="img"
              src="/shrushti-logo.png"
              alt="Shrushti Logo"
              sx={{
                width: 90,
                height: 90,
                mx: "auto",
                mb: 2,
                objectFit: "contain",
                borderRadius: "50%",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0d9488", mb: 0.5, letterSpacing: "-0.5px" }}>
              SHRUSHTI MIS
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Management Information System Portal
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setError("")}>
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px"
                  }
                }}
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px"
                  }
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    fontSize: "13px",
                    color: "#0d9488",
                    textDecoration: "none",
                    fontWeight: "600",
                    "&:hover": { color: "#0f766e" }
                  }}
                >
                  Forgot Password?
                </Link>
              </Box>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                className="premium-btn"
                sx={{
                  py: 1.3,
                  backgroundColor: "#0d9488",
                  "&:hover": { backgroundColor: "#0f766e" },
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: "15px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)"
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Sign In"}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Don't have an account?{" "}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: "#0d9488",
                  textDecoration: "none",
                  fontWeight: "600",
                  "&:hover": { color: "#0f766e" }
                }}
              >
                Request Access
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
