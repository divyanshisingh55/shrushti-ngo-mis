import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setMessage(res.data.message || "Reset link sent. Check your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request. Please try again.");
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

        {/* Right Panel: Forgot Password Form */}
        <div className="auth-right">
          <div className="auth-logo-wrap">
            <img src="/shrushti-logo.png" alt="Shrushti Logo" className="auth-logo" />
          </div>

          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Enter your email to receive a reset link</p>

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

          {!message && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field-group">
                <label className="auth-label">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="auth-input"
                />
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? <span className="auth-spinner" /> : "Send Reset Link"}
              </button>
            </form>
          )}

          <p className="auth-register-text" style={{ marginTop: "24px" }}>
            <Link to="/login" className="auth-register-link">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
