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
  Grid,
  Stack
} from "@mui/material";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    // Password policy check
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/]).{6,}$/;
    if (!pwRegex.test(password)) {
      setError("Password must be at least 6 characters and include uppercase, lowercase, number, and special character.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/auth/register", {
        fullName,
        email,
        password,
        phone,
        designation,
        department,
        employeeId
      });

      setSuccess(res.data.message);
      // Reset form fields
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setEmployeeId("");
      setDesignation("");
      setDepartment("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
        background: "linear-gradient(135deg, #0b1329 0%, #0d9488 100%)",
        overflowY: "auto",
        py: { xs: 4, md: 0 }
      }}
    >
      <Paper
        elevation={24}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          maxWidth: "1060px",
          borderRadius: "20px",
          overflow: "hidden",
          backgroundColor: "background.paper",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.3)",
          my: { xs: 4, md: 0 }
        }}
      >
        {/* Left Side: NGO Work Image Banner */}
        <Box
          sx={{
            width: { xs: "100%", md: "40%" },
            backgroundImage: "url(/ngo_work.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            minHeight: { xs: "250px", md: "580px" },
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
              Join Shrushti
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.85)",
                fontWeight: 500,
                lineHeight: 1.4,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)"
              }}
            >
              Access the centralized Management Information System to coordinate outreach projects, manage finance ledgers, and track social impact.
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Registration Form */}
        <Box
          sx={{
            width: { xs: "100%", md: "60%" },
            p: { xs: 4, md: 5 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <Box sx={{ textAlign: "center", mb: 3 }}>
            {/* Shrushti Logo */}
            <Box
              component="img"
              src="/shrushti-logo.png"
              alt="Shrushti Logo"
              sx={{
                width: 70,
                height: 70,
                mx: "auto",
                mb: 1.5,
                objectFit: "contain",
                borderRadius: "50%",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0d9488", mb: 0.5, letterSpacing: "-0.5px" }}>
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Register access credentials for the Shrushti MIS Portal
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: "10px" }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  variant="outlined"
                  size="small"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address *"
                  type="email"
                  variant="outlined"
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  variant="outlined"
                  size="small"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password (min 6 chars, upper, lower, number, symbol) *"
                  type="password"
                  variant="outlined"
                  size="small"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  variant="outlined"
                  size="small"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Designation"
                  variant="outlined"
                  size="small"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Department"
                  variant="outlined"
                  size="small"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Grid>
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
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
                  {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Register"}
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Already have an account?{" "}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: "#0d9488",
                  textDecoration: "none",
                  fontWeight: "600",
                  "&:hover": { color: "#0f766e" }
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
