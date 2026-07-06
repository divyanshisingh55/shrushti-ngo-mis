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
    if (!pw) return { label: "", color: "#6b7280", width: "0%" };
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
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img src="/shrushti-logo.png" alt="Shrushti" style={styles.logo} />
        </div>

        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Register for the Shrushti MIS Portal</p>

        {error && (
          <div style={styles.errorBox}>
            <span style={{ marginRight: 8 }}>⚠️</span>{error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="Full Name *" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" required />
          <Field label="Email Address *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          <Field label="Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 99999 99999" />
          <Field label="Designation" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Project Manager" />
          <Field label="Department" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Operations" />
          <Field label="Employee ID" name="employeeId" value={form.employeeId} onChange={handleChange} placeholder="e.g. EMP001" />

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password *</label>
            <div style={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                name="password" value={form.password} onChange={handleChange}
                placeholder="Min 8 characters" required style={{ ...styles.input, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn} tabIndex={-1}>
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            {form.password && (
              <div style={styles.strengthBar}>
                <div style={{ ...styles.strengthFill, width: strength.width, background: strength.color }} />
                <span style={{ ...styles.strengthLabel, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <Field
            label="Confirm Password *" name="confirmPassword" type="password"
            value={form.confirmPassword} onChange={handleChange}
            placeholder="Repeat password" required
          />

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? <span style={styles.spinner} /> : "Create Account →"}
          </button>
        </form>

        <p style={styles.loginText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.loginLink}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, placeholder, required }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        style={styles.input}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f766e 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, position: "relative", overflow: "hidden",
    fontFamily: "'Inter', sans-serif"
  },
  blob1: {
    position: "absolute", top: "-15%", left: "-10%", width: 500, height: 500,
    borderRadius: "50%", background: "radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 70%)",
    filter: "blur(60px)", pointerEvents: "none"
  },
  blob2: {
    position: "absolute", bottom: "-10%", right: "-5%", width: 600, height: 600,
    borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
    filter: "blur(80px)", pointerEvents: "none"
  },
  card: {
    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 440,
    boxShadow: "0 25px 60px rgba(0,0,0,0.4)", position: "relative", zIndex: 1
  },
  logoWrap: { display: "flex", justifyContent: "center", marginBottom: 16 },
  logo: { width: 60, height: 60, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", objectFit: "contain" },
  title: { textAlign: "center", color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" },
  subtitle: { textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 24px" },
  errorBox: {
    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 10, padding: "12px 16px", color: "#fca5a5", fontSize: 13,
    marginBottom: 16, display: "flex", alignItems: "center"
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 5 },
  label: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500 },
  input: {
    width: "100%", padding: "11px 13px",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10, color: "#fff", fontSize: 14, outline: "none",
    boxSizing: "border-box", fontFamily: "'Inter', sans-serif"
  },
  passwordWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15 },
  strengthBar: { display: "flex", alignItems: "center", gap: 8, marginTop: 4 },
  strengthFill: { height: 4, borderRadius: 4, flex: 1, transition: "width 0.3s, background 0.3s" },
  strengthLabel: { fontSize: 11, fontWeight: 600, minWidth: 40 },
  btn: {
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg, #0d9488, #0891b2)",
    border: "none", borderRadius: 12, color: "#fff", fontSize: 15,
    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", marginTop: 4, fontFamily: "'Inter', sans-serif"
  },
  spinner: { width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" },
  loginText: { textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 20 },
  loginLink: { color: "#5eead4", textDecoration: "none", fontWeight: 600 }
};
