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
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img src="/shrushti-logo.png" alt="Shrushti" style={styles.logo} />
        </div>
        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.subtitle}>Enter your email to receive a reset link</p>

        {message && <div style={styles.successBox}>✅ {message}</div>}
        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        {!message && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required style={styles.input}
              />
            </div>
            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p style={styles.backText}>
          <Link to="/login" style={styles.backLink}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f766e 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden"
  },
  blob1: {
    position: "absolute", top: "-15%", left: "-10%", width: 500, height: 500,
    borderRadius: "50%", background: "radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 70%)",
    filter: "blur(60px)", pointerEvents: "none"
  },
  card: {
    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24,
    padding: "48px 40px", width: "100%", maxWidth: 420,
    boxShadow: "0 25px 60px rgba(0,0,0,0.4)", position: "relative", zIndex: 1
  },
  logoWrap: { display: "flex", justifyContent: "center", marginBottom: 20 },
  logo: { width: 64, height: 64, borderRadius: "50%", objectFit: "contain" },
  title: { textAlign: "center", color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 6px", fontFamily: "'Playfair Display', serif" },
  subtitle: { textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 28px" },
  successBox: { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 10, padding: "12px 16px", color: "#6ee7b7", fontSize: 13, marginBottom: 20 },
  errorBox: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "12px 16px", color: "#fca5a5", fontSize: 13, marginBottom: 20 },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 },
  input: { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" },
  btn: { width: "100%", padding: "13px", background: "linear-gradient(135deg, #0d9488, #0891b2)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  backText: { textAlign: "center", marginTop: 24 },
  backLink: { color: "#5eead4", textDecoration: "none", fontSize: 13, fontWeight: 500 }
};
