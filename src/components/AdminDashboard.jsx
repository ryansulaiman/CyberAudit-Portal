import { useState } from "react";
import { SECURITY_CHECKS, DEPARTMENTS, scoreAudit, riskOf, fmt, fmtTime } from "../constants/data";
import { RC, RB, RL } from "../styles/theme";
import { Badge, StatusPill, Avatar, Card, Btn, Inp, Sel, Modal } from "./ui";
import EmployeeModal from "./EmployeeModal";
import BulkImportModal from "./BulkImportModal";
import DeleteModal from "./DeleteModal";

// ═══════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════

export default function AdminDashboard({ user, users, setUsers, audits, setAudits, tasks, setTasks, activity, setActivity, notifications, setNotifications, th }) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");
  const [taskFilter, setTaskFilter] = useState("all");
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [commentText, setCommentText] = useState({});
  const [empModal, setEmpModal] = useState(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  const employees = users.filter(u => u.id !== user.id);
  const relevantAudits = audits.filter(a => users.some(u => u.id === a.userId));
  const unreadCount = (notifications[user.id] || []).filter(n => !n.read).length;
  const markAdminRead = () => setNotifications(prev => ({ ...prev, [user.id]: (prev[user.id] || []).map(n => ({ ...n, read: true })) }));

  const scoreAll = relevantAudits.map(a => scoreAudit(a.checks));
  const avgScore = scoreAll.length ? Math.round(scoreAll.reduce((s, x) => s + x, 0) / scoreAll.length) : 0;
  const fullySecure = relevantAudits.filter(a => scoreAudit(a.checks) === 100).length;
  const withIssues = relevantAudits.filter(a => scoreAudit(a.checks) < 100).length;
  const pendingReview = relevantAudits.filter(a => a.status === "pending_review").length;
  const countMissing = id => relevantAudits.filter(a => a.checks[id] === "no").length;
  const trendData = [62, 68, 71, 74, 78, avgScore];
  const maxT = Math.max(...trendData);

  const approveAudit = a => {
    setAudits(prev => prev.map(x => x.id === a.id ? { ...x, status: "approved", approvedBy: user.id } : x));
    setActivity(prev => [{ id: `ac${Date.now()}`, userId: user.id, action: "approved audit", target: users.find(u => u.id === a.userId)?.name, timestamp: new Date().toISOString() }, ...prev]);
    setNotifications(prev => ({ ...prev, [a.userId]: [{ id: `n${Date.now()}`, text: "✅ Your audit has been approved!", read: false, time: new Date().toISOString() }, ...(prev[a.userId] || [])] }));
    setSelectedAudit(null);
  };

  const rejectAudit = a => {
    if (!rejectReason.trim()) return;
    setAudits(prev => prev.map(x => x.id === a.id ? { ...x, status: "rejected", rejectedReason: rejectReason } : x));
    setActivity(prev => [{ id: `ac${Date.now()}`, userId: user.id, action: "rejected audit", target: users.find(u => u.id === a.userId)?.name, timestamp: new Date().toISOString() }, ...prev]);
    setNotifications(prev => ({ ...prev, [a.userId]: [{ id: `n${Date.now()}`, text: `❌ Audit rejected: ${rejectReason}`, read: false, time: new Date().toISOString() }, ...(prev[a.userId] || [])] }));
    setRejectReason("");
    setSelectedAudit(null);
  };

  const addComment = tid => {
    const txt = (commentText[tid] || "").trim();
    if (!txt) return;
    setTasks(prev => prev.map(t => t.id === tid ? { ...t, comments: [...(t.comments || []), { id: `c${Date.now()}`, userId: user.id, text: txt, time: new Date().toISOString() }] } : t));
    setCommentText(p => ({ ...p, [tid]: "" }));
  };

  const sendReminder = emp => {
    setNotifications(prev => ({ ...prev, [emp.id]: [{ id: `n${Date.now()}`, text: "⚠️ Reminder: Please submit your security audit!", read: false, time: new Date().toISOString() }, ...(prev[emp.id] || [])] }));
    setActivity(prev => [{ id: `ac${Date.now()}`, userId: user.id, action: "sent reminder to", target: emp.name, timestamp: new Date().toISOString() }, ...prev]);
  };

  const saveEmployee = emp => {
    if (empModal.mode === "add") {
      setUsers(prev => [...prev, emp]);
      setActivity(prev => [{ id: `ac${Date.now()}`, userId: user.id, action: "added employee", target: emp.name, timestamp: new Date().toISOString() }, ...prev]);
    } else {
      setUsers(prev => prev.map(u => u.id === emp.id ? emp : u));
      setActivity(prev => [{ id: `ac${Date.now()}`, userId: user.id, action: "updated employee", target: emp.name, timestamp: new Date().toISOString() }, ...prev]);
    }
    setEmpModal(null);
  };

  const bulkImport = emps => {
    setUsers(prev => {
      const existingEmails = prev.map(u => u.email.toLowerCase());
      const newOnes = emps.filter(e => !existingEmails.includes(e.email.toLowerCase()));
      return [...prev, ...newOnes];
    });
    setActivity(prev => [{ id: `ac${Date.now()}`, userId: user.id, action: `bulk imported ${emps.length} employees`, target: "", timestamp: new Date().toISOString() }, ...prev]);
    setBulkModal(false);
  };

  const deleteEmployee = emp => {
    setUsers(prev => prev.filter(u => u.id !== emp.id));
    setAudits(prev => prev.filter(a => a.userId !== emp.id));
    setTasks(prev => prev.filter(t => t.userId !== emp.id));
    setActivity(prev => [{ id: `ac${Date.now()}`, userId: user.id, action: "removed employee", target: emp.name, timestamp: new Date().toISOString() }, ...prev]);
    setDeleteModal(null);
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Dept", "Role", "Device", "Score", "Status", "Date"]];
    users.forEach(u => {
      const a = audits.find(x => x.userId === u.id);
      const sc = a ? scoreAudit(a.checks) : null;
      rows.push([u.name, u.email, u.department, u.role, a ? `${a.deviceType} - ${a.deviceModel}` : "N/A", sc !== null ? `${sc}%` : "N/A", a ? RL[riskOf(sc)] : "Not Submitted", a ? fmt(a.submittedAt) : "N/A"]);
    });
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "security_report.csv";
    a.click();
  };

  const filteredEmployees = employees.filter(u => {
    const a = audits.find(x => x.userId === u.id);
    const sc = a ? scoreAudit(a.checks) : null;
    const risk = sc !== null ? riskOf(sc) : null;
    return (
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
      (filterDept === "All" || u.department === filterDept) &&
      (filterRisk === "All" || (filterRisk === "none" && !a) || risk === filterRisk)
    );
  });

  const filteredTasks = tasks.filter(t => users.some(u => u.id === t.userId) && (taskFilter === "all" || t.status === taskFilter));

  const TABS = [["overview", "📊", "Overview"], ["employees", "👥", "Employees"], ["tasks", "📋", "Tasks"], ["reports", "📈", "Reports"], ["activity", "🕐", "Activity"]];

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto", padding: "24px 16px", color: th.text }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🛡️ Admin Dashboard</div>
          <div style={{ fontSize: 13, color: th.sub }}>{user.name} · Administrator</div>
        </div>
        <button onClick={markAdminRead} style={{ background: th.card, border: `1.5px solid ${th.border}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: th.text, fontSize: 15 }}>
          🔔{unreadCount > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{unreadCount}</span>}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
        {TABS.map(([id, icon, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: tab === id ? th.accent : th.input, color: tab === id ? "#fff" : th.sub }}>
            {icon} {lbl}{id === "employees" && pendingReview > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, padding: "0 5px", fontSize: 10, marginLeft: 4 }}>{pendingReview}</span>}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 18 }}>
            {[["Total Users", users.length, "#6366f1"], ["Submitted", relevantAudits.length, "#0ea5e9"], ["Pending Review", pendingReview, "#f59e0b"], ["Fully Secure", fullySecure, "#22c55e"], ["Issues Found", withIssues, "#ef4444"], ["Avg Score", `${avgScore}%`, "#8b5cf6"]].map(([lbl, val, col]) => (
              <Card key={lbl} th={th} style={{ textAlign: "center", padding: "16px 10px" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: col }}>{val}</div>
                <div style={{ fontSize: 11, color: th.sub, marginTop: 2 }}>{lbl}</div>
              </Card>
            ))}
          </div>

          <Card th={th} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📈 Compliance Trend</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
              {trendData.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: i === trendData.length - 1 ? th.accent : th.sub }}>{v}%</div>
                  <div style={{ width: "100%", height: `${(v / maxT) * 60}px`, background: i === trendData.length - 1 ? th.accent : th.border, borderRadius: "4px 4px 0 0" }} />
                  <div style={{ fontSize: 9, color: th.sub }}>{["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i]}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card th={th} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🚨 Compliance Indicators</div>
            {SECURITY_CHECKS.map(c => {
              const n = countMissing(c.id);
              const pct = users.length ? (n / users.length) * 100 : 0;
              const col = pct === 0 ? "#22c55e" : pct < 30 ? "#f59e0b" : "#ef4444";
              return (
                <div key={c.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>{c.icon} {c.label}</span>
                    <span style={{ fontWeight: 700, color: col }}>{n} missing</span>
                  </div>
                  <div style={{ background: th.border, borderRadius: 99, height: 6 }}>
                    <div style={{ width: `${pct}%`, background: col, height: 6, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </Card>

          <Card th={th}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📭 No Audit Submitted</div>
            {users.filter(u => !audits.find(a => a.userId === u.id)).map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${th.border}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Avatar initials={u.avatar} size={28} color="#6366f1" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: th.sub }}>{u.department}</div>
                  </div>
                </div>
                <Btn th={th} variant="secondary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => sendReminder(u)}>🔔 Remind</Btn>
              </div>
            ))}
            {users.every(u => audits.find(a => a.userId === u.id)) && <div style={{ color: th.sub, fontSize: 13 }}>All users submitted ✅</div>}
          </Card>
        </>
      )}

      {/* ── EMPLOYEES ── */}
      {tab === "employees" && (
        <Card th={th}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Inp th={th} placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 2, minWidth: 140 }} />
            <Sel th={th} value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ flex: 1, minWidth: 110 }}>
              <option>All</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </Sel>
            <Sel th={th} value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ flex: 1, minWidth: 120 }}>
              <option value="All">All Statuses</option>
              <option value="secure">Secure</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
              <option value="none">Not Submitted</option>
            </Sel>
            <Btn th={th} onClick={() => setEmpModal({ mode: "add" })} style={{ whiteSpace: "nowrap" }}>➕ Add</Btn>
            <Btn th={th} variant="secondary" onClick={() => setBulkModal(true)} style={{ whiteSpace: "nowrap" }}>📥 Import</Btn>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: th.input }}>
                  {["Employee", "Dept", "Role", "Device", "Score", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: th.sub, borderBottom: `2px solid ${th.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(u => {
                  const a = audits.find(x => x.userId === u.id);
                  const sc = a ? scoreAudit(a.checks) : null;
                  const risk = sc !== null ? riskOf(sc) : null;
                  return (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${th.border}` }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <Avatar initials={u.avatar} size={28} color="#6366f1" />
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ color: th.sub, fontSize: 11 }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", color: th.sub }}>{u.department}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: u.role === "admin" ? "#ede9fe" : "#f0fdf4", color: u.role === "admin" ? "#5b21b6" : "#166534", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{u.role}</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: th.sub, fontSize: 12 }}>{a ? `${a.deviceType} · ${a.deviceModel}` : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 800, color: sc !== null ? RC[risk] : th.sub }}>{sc !== null ? `${sc}%` : "—"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {risk && <Badge risk={risk} />}
                          {a && <StatusPill status={a.status} />}
                          {!a && <span style={{ fontSize: 11, color: th.sub }}>Not submitted</span>}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {a && <button onClick={() => setSelectedAudit(a)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1px solid ${th.border}`, background: th.card, cursor: "pointer", color: th.accent, fontWeight: 700 }}>Review</button>}
                          <button onClick={() => setEmpModal({ mode: "edit", employee: u })} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1px solid ${th.border}`, background: th.card, cursor: "pointer", color: th.sub }}>✏️</button>
                          {!a && <button onClick={() => sendReminder(u)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1px solid ${th.accent}`, background: "transparent", cursor: "pointer", color: th.accent, fontWeight: 700 }}>🔔</button>}
                          <button onClick={() => setDeleteModal(u)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fee2e2", cursor: "pointer", color: "#dc2626", fontWeight: 700 }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredEmployees.length === 0 && <div style={{ textAlign: "center", color: th.sub, padding: 28 }}>No employees match your filters.</div>}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: th.sub }}>Showing {filteredEmployees.length} of {employees.length} users</div>
        </Card>
      )}

      {/* ── TASKS ── */}
      {tab === "tasks" && (
        <Card th={th}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["all", "pending", "in_progress", "completed"].map(s => (
              <button key={s} onClick={() => setTaskFilter(s)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: taskFilter === s ? th.accent : th.input, color: taskFilter === s ? "#fff" : th.sub }}>
                {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)} ({tasks.filter(t => users.some(u => u.id === t.userId) && (s === "all" || t.status === s)).length})
              </button>
            ))}
          </div>
          {filteredTasks.length === 0 && <div style={{ color: th.sub, textAlign: "center", padding: 28 }}>No tasks found 🎉</div>}
          {filteredTasks.map(t => {
            const emp = users.find(u => u.id === t.userId);
            const assignee = users.find(u => u.id === t.assignedTo);
            return (
              <div key={t.id} style={{ padding: "14px 0", borderBottom: `1px solid ${th.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>⚠️ {t.label}</div>
                    <div style={{ fontSize: 11, color: th.sub, marginTop: 2 }}>{emp?.name} · Due {fmt(t.dueDate)} · Assigned: {assignee?.name || "Unassigned"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <StatusPill status={t.status} />
                    <select
                      value={t.status}
                      onChange={e => {
                        setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: e.target.value } : x));
                        setActivity(prev => [{ id: `ac${Date.now()}`, userId: user.id, action: `updated task to ${e.target.value}`, target: t.label, timestamp: new Date().toISOString() }, ...prev]);
                      }}
                      style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1.5px solid ${th.border}`, background: th.card, color: th.text, cursor: "pointer" }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <select
                      value={t.assignedTo || ""}
                      onChange={e => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, assignedTo: e.target.value } : x))}
                      style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1.5px solid ${th.border}`, background: th.card, color: th.text, cursor: "pointer" }}
                    >
                      <option value="">Unassigned</option>
                      {users.filter(u => u.role === "admin").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  {(t.comments || []).map(c => {
                    const cu = users.find(u => u.id === c.userId);
                    return <div key={c.id} style={{ fontSize: 12, color: th.sub, marginBottom: 4 }}>💬 <strong>{cu?.name}:</strong> {c.text} · <span style={{ fontSize: 10 }}>{fmtTime(c.time)}</span></div>;
                  })}
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <input
                      value={commentText[t.id] || ""}
                      onChange={e => setCommentText(p => ({ ...p, [t.id]: e.target.value }))}
                      placeholder="Add comment…"
                      onKeyDown={e => e.key === "Enter" && addComment(t.id)}
                      style={{ flex: 1, fontSize: 12, padding: "5px 10px", borderRadius: 6, border: `1px solid ${th.border}`, background: th.input, color: th.text }}
                    />
                    <button onClick={() => addComment(t.id)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, background: th.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>Send</button>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── REPORTS ── */}
      {tab === "reports" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
            {[["Overall Compliance", `${avgScore}%`, "#6366f1"], ["Submitted", `${relevantAudits.length}/${users.length}`, "#0ea5e9"], ["Open Tasks", tasks.filter(t => t.status !== "completed").length, "#f59e0b"]].map(([lbl, val, col]) => (
              <Card key={lbl} th={th} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: col }}>{val}</div>
                <div style={{ fontSize: 12, color: th.sub }}>{lbl}</div>
              </Card>
            ))}
          </div>
          <Card th={th} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📋 Employee Compliance</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {users.map(u => {
                const a = audits.find(x => x.userId === u.id);
                const sc = a ? scoreAudit(a.checks) : null;
                const risk = sc !== null ? riskOf(sc) : null;
                return (
                  <div key={u.id} style={{ padding: "12px 14px", borderRadius: 10, background: risk ? RB[risk] : th.input, border: `1.5px solid ${risk ? RC[risk] + "44" : th.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: th.sub }}>{u.department}</div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: risk ? RC[risk] : th.sub }}>{sc !== null ? `${sc}%` : "—"}</div>
                    </div>
                    <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                      {risk && <Badge risk={risk} />}
                      {a && <StatusPill status={a.status} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn th={th} onClick={exportCSV}>⬇️ Export CSV</Btn>
            <Btn th={th} variant="secondary" onClick={() => window.print()}>🖨️ Print / PDF</Btn>
          </div>
        </>
      )}

      {/* ── ACTIVITY ── */}
      {tab === "activity" && (
        <Card th={th}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🕐 Activity Log</div>
          {activity.slice(0, 40).map(a => {
            const u = users.find(x => x.id === a.userId);
            return (
              <div key={a.id} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${th.border}`, alignItems: "center" }}>
                <Avatar initials={u?.avatar || "?"} size={28} color="#6366f1" />
                <div style={{ flex: 1, fontSize: 13 }}>
                  <strong>{u?.name}</strong> <span style={{ color: th.sub }}>{a.action}</span>{a.target ? <> <strong>{a.target}</strong></> : null}
                </div>
                <div style={{ fontSize: 11, color: th.sub, whiteSpace: "nowrap" }}>{fmtTime(a.timestamp)}</div>
              </div>
            );
          })}
          {activity.length === 0 && <div style={{ color: th.sub, textAlign: "center", padding: 24 }}>No activity yet.</div>}
        </Card>
      )}

      {/* ── AUDIT REVIEW MODAL ── */}
      {selectedAudit && (() => {
        const emp = users.find(u => u.id === selectedAudit.userId);
        const sc = scoreAudit(selectedAudit.checks);
        const risk = riskOf(sc);
        return (
          <Modal th={th} title={`🔍 Audit Review — ${emp?.name}`} onClose={() => setSelectedAudit(null)} width={540}>
            <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: RC[risk] }}>{sc}%</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Badge risk={risk} />
                <StatusPill status={selectedAudit.status} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: th.sub, marginBottom: 14 }}>
              {selectedAudit.deviceType} · {selectedAudit.deviceModel} · {selectedAudit.osVersion} · v{selectedAudit.version} · {fmt(selectedAudit.submittedAt)}
            </div>
            {SECURITY_CHECKS.map(c => {
              const val = selectedAudit.checks[c.id];
              const ss = selectedAudit.screenshots?.[c.id];
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, marginBottom: 6, background: val === "yes" ? RB.secure : RB.danger }}>
                  <span style={{ fontSize: 13 }}>{val === "yes" ? "✅" : "❌"} {c.label}</span>
                  {ss?.dataUrl && <img src={ss.dataUrl} alt="proof" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, cursor: "pointer" }} onClick={() => window.open(ss.dataUrl)} />}
                  {ss && !ss.dataUrl && <span style={{ fontSize: 11, color: th.sub }}>📸 {ss.name}</span>}
                </div>
              );
            })}
            {selectedAudit.status === "pending_review" && (
              <div style={{ marginTop: 16 }}>
                <input
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Rejection reason (required to reject)…"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, boxSizing: "border-box", marginBottom: 10 }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn th={th} variant="success" onClick={() => approveAudit(selectedAudit)}>✅ Approve</Btn>
                  <Btn th={th} variant="danger" onClick={() => rejectAudit(selectedAudit)} disabled={!rejectReason.trim()}>❌ Reject</Btn>
                </div>
              </div>
            )}
            {selectedAudit.rejectedReason && (
              <div style={{ marginTop: 12, background: RB.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
                Rejected: {selectedAudit.rejectedReason}
              </div>
            )}
          </Modal>
        );
      })()}

      {/* Other Modals */}
      {empModal && <EmployeeModal th={th} mode={empModal.mode} employee={empModal.employee} onSave={saveEmployee} onClose={() => setEmpModal(null)} />}
      {bulkModal && <BulkImportModal th={th} onImport={bulkImport} onClose={() => setBulkModal(false)} />}
      {deleteModal && <DeleteModal th={th} employee={deleteModal} onConfirm={() => deleteEmployee(deleteModal)} onClose={() => setDeleteModal(null)} />}
    </div>
  );
}
