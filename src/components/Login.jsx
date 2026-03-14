import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════

export default function Login({ onLogin, users }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    if (locked && lockTimer > 0) {
      const t = setTimeout(() => setLockTimer(l => l - 1), 1000);
      return () => clearTimeout(t);
    }
    if (locked && lockTimer === 0) setLocked(false);
  }, [locked, lockTimer]);

  const handle = () => {
    if (locked) return;
    const u = users.find(u => u.email === email && u.password === pass);
    if (u) {
      setErr("");
      onLogin(u);
    } else {
      const a = attempts + 1;
      setAttempts(a);
      if (a >= 3) {
        setLocked(true);
        setLockTimer(30);
        setErr("Too many attempts. Locked for 30s.");
      } else {
        setErr(`Invalid credentials. ${3 - a} attempt(s) left.`);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1e1b4b,#312e81,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, width: 380, boxShadow: "0 24px 64px #0005" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>🔐</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", marginTop: 6 }}>CyberAudit Portal</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Self-Audit & Compliance Platform</div>
        </div>

        {!resetting ? (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Company Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              onKeyDown={e => e.key === "Enter" && handle()}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", marginBottom: 12, fontSize: 14, boxSizing: "border-box" }}
            />
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Password</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handle()}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", marginBottom: 14, fontSize: 14, boxSizing: "border-box" }}
            />
            {locked && (
              <div style={{ background: "#fee2e2", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#991b1b", marginBottom: 10 }}>
                🔒 Locked. Wait {lockTimer}s.
              </div>
            )}
            {err && !locked && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>{err}</div>}
            <button
              onClick={handle}
              disabled={locked}
              style={{ width: "100%", background: locked ? "#94a3b8" : "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: 11, fontSize: 15, fontWeight: 700, cursor: locked ? "not-allowed" : "pointer" }}
            >
              Sign In
            </button>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button onClick={() => setResetting(true)} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                Forgot password?
              </button>
            </div>
            <div style={{ marginTop: 18, background: "#f8fafc", borderRadius: 8, padding: "12px 14px", fontSize: 11, color: "#64748b" }}>
              <strong>Demo:</strong> admin@company.com / admin123<br />Employee: alice@company.com / pass123
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>Reset Password</div>
            <input
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              placeholder="your@company.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", marginBottom: 12, fontSize: 14, boxSizing: "border-box" }}
            />
            {resetMsg && (
              <div style={{ fontSize: 13, marginBottom: 10, color: resetMsg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>
                {resetMsg}
              </div>
            )}
            <button
              onClick={() => {
                const u = users.find(u => u.email === resetEmail);
                setResetMsg(u ? `✅ Reset link sent to ${resetEmail}` : "❌ Email not found.");
              }}
              style={{ width: "100%", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}
            >
              Send Reset Link
            </button>
            <button
              onClick={() => { setResetting(false); setResetMsg(""); }}
              style={{ width: "100%", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: 10, fontSize: 14, cursor: "pointer" }}
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
