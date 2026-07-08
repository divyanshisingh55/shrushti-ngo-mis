import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return { label: "", color: "#64748b", width: "0%" };
    const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
    const score = checks.filter(Boolean).length;
    if (score <= 1) return { label: "Weak", color: "#ef4444", width: "25%" };
    if (score === 2) return { label: "Fair", color: "#f59e0b", width: "50%" };
    if (score === 3) return { label: "Good", color: "#10b981", width: "75%" };
    return { label: "Strong", color: "#0d9488", width: "100%" };
  };

  const strength = getPasswordStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        newPassword: form.newPassword
      });
      setMessage(res.data.message || "Password reset successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Left Panel: Image & Text Overlay */}
        <div className="auth-left">
          <div className="auth-left-overlay">
            <h2 className="auth-left-title">Shrushti Seva Samiti</h2>
            <p className="auth-left-text">
              Empowering communities, driving rural development, and building a sustainable future.
            </p>
          </div>
        </div>

        {/* Right Panel: Reset Password Form */}
        <div className="auth-right">
          <div className="auth-logo-wrap">
            <img src="/shrushti-logo.png" alt="Shrushti Logo" className="auth-logo" />
          </div>

          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your new password below</p>

          {!token && (
            <div className="auth-error-box">
              <span style={{ marginRight: 8 }}>⚠️</span>
              Invalid or missing reset token. Please request a new link.
            </div>
          )}

          {message && (
            <div className="auth-error-box" style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#065f46" }}>
              <span style={{ marginRight: 8 }}>✅</span>
              {message}
            </div>
          )}
          {error && (
            <div className="auth-error-box">
              <span style={{ marginRight: 8 }}>⚠️</span>
              {error}
            </div>
          )}

          {token && !message && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field-group">
                <label className="auth-label">New Password *</label>
                <div className="auth-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    required
                    className="auth-input"
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-eye-btn"
                    tabIndex={-1}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
                {form.newPassword && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <div style={{ height: "4px", borderRadius: "4px", flex: 1, background: "#cbd5e1", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: strength.width, background: strength.color, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: strength.color, minWidth: "40px" }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Confirm New Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat new password"
                  required
                  className="auth-input"
                />
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? <span className="auth-spinner" /> : "Reset Password"}
              </button>
            </form>
          )}

          <p className="auth-register-text" style={{ marginTop: "24px" }}>
            <Link to="/login" className="auth-register-link">
              ← Go to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
