import { useState } from "react";
import { SECURITY_CHECKS, DEADLINE, scoreAudit, riskOf, fmt, fmtTime, daysLeft } from "../constants/data";
import { RC, RB } from "../styles/theme";
import { Badge, StatusPill, Card, Btn } from "./ui";
import AuditForm from "./AuditForm";

// ═══════════════════════════════════════════════════════════════════
// EMPLOYEE DASHBOARD
// ═══════════════════════════════════════════════════════════════════

export default function EmployeeDashboard({ user, audits, setAudits, tasks, setTasks, setActivity, notifications, setNotifications, th }) {
  const [view, setView] = useState("home");

  const audit = audits.find(a => a.userId === user.id);
  const myTasks = tasks.filter(t => t.userId === user.id);
  const score = audit ? scoreAudit(audit.checks) : null;
  const risk = score !== null ? riskOf(score) : null;
  const dl = daysLeft(DEADLINE);
  const myNotifs = notifications[user.id] || [];
  const unread = myNotifs.filter(n => !n.read).length;
  const markRead = () => setNotifications(prev => ({ ...prev, [user.id]: (prev[user.id] || []).map(n => ({ ...n, read: true })) }));

  if (view === "audit") return (
    <AuditForm
      user={user}
      audits={audits}
      setAudits={setAudits}
      tasks={tasks}
      setTasks={setTasks}
      setActivity={setActivity}
      setNotifications={setNotifications}
      onDone={() => setView("home")}
      th={th}
    />
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px", color: th.text }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>👋 Welcome, {user.name.split(" ")[0]}</div>
          <div style={{ fontSize: 13, color: th.sub }}>{user.department} · {user.email}</div>
        </div>
        <button
          onClick={markRead}
          style={{ background: th.card, border: `1.5px solid ${th.border}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: th.text, fontSize: 16 }}
        >
          🔔{unread > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{unread}</span>}
        </button>
      </div>

      {/* Notifications */}
      {myNotifs.length > 0 && (
        <Card th={th} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔔 Notifications</div>
          {myNotifs.slice(0, 3).map(n => (
            <div key={n.id} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${th.border}`, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.read ? th.border : "#6366f1", flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: n.read ? th.sub : th.text, flex: 1 }}>{n.text}</div>
              <div style={{ fontSize: 11, color: th.sub }}>{fmtTime(n.time)}</div>
            </div>
          ))}
        </Card>
      )}

      {/* Deadline Banner */}
      <div style={{ background: dl <= 2 ? RB.danger : dl <= 5 ? RB.warning : RB.secure, borderRadius: 10, padding: "10px 16px", marginBottom: 14, fontSize: 13, fontWeight: 600, color: dl <= 2 ? "#991b1b" : dl <= 5 ? "#78350f" : "#166534" }}>
        {dl <= 0 ? "🚨 Deadline passed!" : `⏰ Deadline: ${fmt(DEADLINE)} — ${dl} day(s) left`}
      </div>

      {/* Audit Status Card */}
      <Card th={th} style={{ marginBottom: 14, border: `2px solid ${audit ? RC[risk] + "55" : "#6366f155"}` }}>
        {audit ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", border: `5px solid ${RC[risk]}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: RC[risk] }}>{score}%</div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Compliance Score</div>
                <div style={{ fontSize: 12, color: th.sub }}>v{audit.version} · {fmt(audit.submittedAt)}</div>
                <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                  <Badge risk={risk} />
                  <StatusPill status={audit.status} />
                </div>
              </div>
            </div>
            <Btn th={th} onClick={() => setView("audit")}>📝 Update</Btn>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#5b21b6" }}>🚨 Audit Not Submitted</div>
              <div style={{ fontSize: 13, color: th.sub, marginTop: 4 }}>Complete your security self-audit before the deadline.</div>
            </div>
            <Btn th={th} onClick={() => setView("audit")}>Start Audit →</Btn>
          </div>
        )}
      </Card>

      {/* Security Check Grid */}
      {audit && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          {SECURITY_CHECKS.map(c => {
            const val = audit.checks[c.id];
            return (
              <div key={c.id} style={{ padding: "10px 12px", borderRadius: 10, background: val === "yes" ? RB.secure : RB.danger, border: `1px solid ${val === "yes" ? "#86efac" : "#fca5a5"}`, fontSize: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>{c.icon}</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{val === "yes" ? "✅" : "❌"}</div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{c.label.split("&")[0].trim()}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tasks */}
      {myTasks.length > 0 && (
        <Card th={th}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>📋 My Tasks ({myTasks.filter(t => t.status !== "completed").length} open)</div>
          {myTasks.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${th.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>⚠️ {t.label}</div>
              <StatusPill status={t.status} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
