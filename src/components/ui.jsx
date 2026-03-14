// ═══════════════════════════════════════════════════════════════════
// SHARED UI ATOMS
// ═══════════════════════════════════════════════════════════════════

import { RC, RB, RL } from "../styles/theme";

export const Badge = ({ risk }) => (
  <span style={{ background: RB[risk], color: RC[risk], padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, border: `1px solid ${RC[risk]}33` }}>
    {RL[risk]}
  </span>
);

export const StatusPill = ({ status }) => {
  const m = {
    pending: ["#fef3c7", "#92400e", "Pending"],
    in_progress: ["#dbeafe", "#1e40af", "In Progress"],
    completed: ["#dcfce7", "#166534", "Completed"],
    pending_review: ["#ede9fe", "#5b21b6", "Pending Review"],
    approved: ["#dcfce7", "#166534", "Approved"],
    rejected: ["#fee2e2", "#991b1b", "Rejected"],
  };
  const [bg, col, lbl] = m[status] || m.pending;
  return <span style={{ background: bg, color: col, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{lbl}</span>;
};

export const Avatar = ({ initials, size = 34, color = "#4f46e5" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 800, flexShrink: 0 }}>
    {initials}
  </div>
);

export const Card = ({ th, children, style }) => (
  <div style={{ background: th.card, borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 6px #0001", border: `1px solid ${th.border}`, ...style }}>
    {children}
  </div>
);

export const Btn = ({ variant = "primary", th, children, ...p }) => {
  const s = {
    primary: { background: th.accent, color: "#fff", border: "none" },
    secondary: { background: "transparent", color: th.accent, border: `1.5px solid ${th.accent}` },
    ghost: { background: th.input, color: th.sub, border: `1.5px solid ${th.border}` },
    danger: { background: "#ef4444", color: "#fff", border: "none" },
    success: { background: "#22c55e", color: "#fff", border: "none" },
  };
  return (
    <button
      {...p}
      style={{ ...s[variant], padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: p.disabled ? "not-allowed" : "pointer", opacity: p.disabled ? 0.5 : 1, ...p.style }}
    >
      {children}
    </button>
  );
};

export const Inp = ({ th, ...p }) => (
  <input
    {...p}
    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${th.border}`, background: th.input, color: th.text, fontSize: 14, boxSizing: "border-box", outline: "none", ...p.style }}
  />
);

export const Sel = ({ th, children, ...p }) => (
  <select
    {...p}
    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${th.border}`, background: th.input, color: th.text, fontSize: 14, boxSizing: "border-box", ...p.style }}
  >
    {children}
  </select>
);

// ═══════════════════════════════════════════════════════════════════
// MODAL WRAPPER
// ═══════════════════════════════════════════════════════════════════

export const Modal = ({ th, title, onClose, children, width = 500 }) => (
  <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
    <div style={{ background: th.card, borderRadius: 16, padding: 28, width: "100%", maxWidth: width, maxHeight: "88vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: th.text }}>{title}</div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: th.sub }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);
