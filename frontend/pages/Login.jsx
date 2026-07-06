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
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <img src="/shrushti-logo.png" alt="Shrushti" style={styles.logo} />
        </div>

        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to Shrushti MIS Portal</p>

        {error && (
          <div style={styles.errorBox}>
            <span style={{ marginRight: 8 }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                style={{ ...styles.input, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div style={styles.row}>
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Remember me
            </label>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        <p style={styles.registerText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.registerLink}>
            Create Account
          </Link>
        </p>

        <p style={styles.orgName}>Shrushti NGO — Management Information System</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f766e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif"
  },
  blob1: {
    position: "absolute", top: "-15%", left: "-10%",
    width: 500, height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 70%)",
    filter: "blur(60px)", pointerEvents: "none"
  },
  blob2: {
    position: "absolute", bottom: "-10%", right: "-5%",
    width: 600, height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
    filter: "blur(80px)", pointerEvents: "none"
  },
  blob3: {
    position: "absolute", top: "40%", left: "60%",
    width: 300, height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
    filter: "blur(60px)", pointerEvents: "none"
  },
  card: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: "48px 40px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
    position: "relative",
    zIndex: 1
  },
  logoWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20
  },
  logo: {
    width: 72, height: 72,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.2)",
    objectFit: "contain",
    background: "rgba(255,255,255,0.1)"
  },
  title: {
    textAlign: "center",
    color: "#fff",
    fontSize: 26,
    fontWeight: 700,
    margin: "0 0 6px",
    fontFamily: "'Playfair Display', serif"
  },
  subtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    margin: "0 0 28px"
  },
  errorBox: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#fca5a5",
    fontSize: 13,
    marginBottom: 20,
    display: "flex",
    alignItems: "center"
  },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    fontFamily: "'Inter', sans-serif"
  },
  passwordWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none",
    cursor: "pointer", fontSize: 16, padding: 0
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  checkLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    cursor: "pointer"
  },
  forgotLink: {
    color: "#5eead4",
    fontSize: 13,
    textDecoration: "none",
    fontWeight: 500
  },
  btn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #0d9488, #0891b2)",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    letterSpacing: 0.3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "'Inter', sans-serif"
  },
  spinner: {
    width: 20, height: 20,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block"
  },
  registerText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginTop: 24
  },
  registerLink: {
    color: "#5eead4",
    textDecoration: "none",
    fontWeight: 600
  },
  orgName: {
    textAlign: "center",
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    marginTop: 24,
    letterSpacing: 0.5
  }
};
