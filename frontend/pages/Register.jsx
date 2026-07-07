import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    phone: "", designation: "", department: "", employeeId: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone || undefined,
        designation: form.designation || undefined,
        department: form.department || undefined,
        employeeId: form.employeeId || undefined
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "1080px" }}>
        {/* Left Panel: Image & Text Overlay */}
        <div className="auth-left">
          <div className="auth-left-overlay">
            <h2 className="auth-left-title">Shrushti Seva Samiti</h2>
            <p className="auth-left-text">
              Empowering communities, driving rural development, and building a sustainable future.
            </p>
          </div>
        </div>

        {/* Right Panel: Registration Form */}
        <div className="auth-right" style={{ padding: "40px" }}>
          <div className="auth-logo-wrap" style={{ marginBottom: "16px" }}>
            <img src="/shrushti-logo.png" alt="Shrushti Logo" className="auth-logo" style={{ width: "64px", height: "64px" }} />
          </div>

          <h1 className="auth-title" style={{ fontSize: "24px" }}>Create Account</h1>
          <p className="auth-subtitle" style={{ marginBottom: "24px" }}>Register for the Shrushti MIS Portal</p>

          {error && (
            <div className="auth-error-box" style={{ marginBottom: "16px" }}>
              <span style={{ marginRight: 8 }}>⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-grid-form">
              {/* Full Name */}
              <div className="auth-field-group">
                <label className="auth-label">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  className="auth-input"
                />
              </div>

              {/* Email Address */}
              <div className="auth-field-group">
                <label className="auth-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="auth-input"
                />
              </div>

              {/* Phone Number */}
              <div className="auth-field-group">
                <label className="auth-label">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 99999 99999"
                  className="auth-input"
                />
              </div>

              {/* Employee ID */}
              <div className="auth-field-group">
                <label className="auth-label">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. EMP001"
                  className="auth-input"
                />
              </div>

              {/* Designation */}
              <div className="auth-field-group">
                <label className="auth-label">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="e.g. Project Manager"
                  className="auth-input"
                />
              </div>

              {/* Department */}
              <div className="auth-field-group">
                <label className="auth-label">Department</label>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="e.g. Operations"
                  className="auth-input"
                />
              </div>

              {/* Password */}
              <div className="auth-field-group">
                <label className="auth-label">Password *</label>
                <div className="auth-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
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
                {form.password && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <div style={{ height: "4px", borderRadius: "4px", flex: 1, background: "#cbd5e1", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: strength.width, background: strength.color, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: strength.color, minWidth: "40px" }}>{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="auth-field-group">
                <label className="auth-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  required
                  className="auth-input"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-btn" style={{ marginTop: "8px" }}>
              {loading ? <span className="auth-spinner" /> : "Create Account"}
            </button>
          </form>

          <p className="auth-register-text" style={{ marginTop: "16px" }}>
            Already have an account?{" "}
            <Link to="/login" className="auth-register-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
