import { useEffect, useState } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import api from "../services/api";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Alert,
  Stack
} from "@mui/material";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      triggerVerification();
    } else {
      setError("Verification token is missing from the URL.");
      setLoading(false);
    }
  }, [token]);

  const triggerVerification = async () => {
    try {
      const res = await api.post("/auth/verify-email", { token });
      setSuccess(res.data.message);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Email verification failed. Link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "75vh", px: 2 }}>
      <Paper sx={{ p: 4, width: "100%", maxWidth: "440px", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)", textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#0d9488", mb: 3 }}>
          Email Verification
        </Typography>

        {loading ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 3 }}>
            <CircularProgress sx={{ color: "#0d9488" }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Verifying your email token...
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: "8px" }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ borderRadius: "8px" }}>
                {success}
              </Alert>
            )}

            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              sx={{
                py: 1.2,
                backgroundColor: "#0d9488",
                "&:hover": { backgroundColor: "#0f766e" },
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: "8px"
              }}
            >
              Go to Login
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
