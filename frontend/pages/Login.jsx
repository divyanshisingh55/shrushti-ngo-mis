import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
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

        {/* Right Panel: Sign In Form */}
        <div className="auth-right">
          <div className="auth-logo-wrap">
            <img src="/shrushti-logo.png" alt="Shrushti Logo" className="auth-logo" />
          </div>

          <h1 className="auth-title">SHRUSHTI MIS</h1>
          <p className="auth-subtitle">Management Information System Portal</p>

          {error && (
            <div className="auth-error-box">
              <span style={{ marginRight: 8 }}>⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field-group">
              <label className="auth-label">Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="singhdivyanshi55@gmail.com"
                required
                autoComplete="email"
                className="auth-input"
              />
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Password *</label>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
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
            </div>

            <div className="auth-row">
              <label className="auth-check-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ marginRight: "6px" }}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="auth-forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? <span className="auth-spinner" /> : "Sign In"}
            </button>
          </form>

          <p className="auth-register-text">
            Don't have an account?{" "}
            <Link to="/register" className="auth-register-link">
              Request Access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
