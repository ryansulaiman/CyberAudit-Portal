import { useState, useEffect } from "react";
import { INIT_USERS, INIT_AUDITS, INIT_ACTIVITY, INIT_NOTIFS, initTasks } from "./constants/data";
import { light, dark } from "./styles/theme";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";

// ═══════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [users, setUsers] = useState(INIT_USERS);
  const [audits, setAudits] = useState(INIT_AUDITS);
  const [tasks, setTasks] = useState(() => initTasks(INIT_AUDITS));
  const [activity, setActivity] = useState(INIT_ACTIVITY);
  const [notifications, setNotifications] = useState(INIT_NOTIFS);
  const [loading, setLoading] = useState(true);

  const th = darkMode ? dark : light;

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("portal_v3");
        if (r?.value) {
          const s = JSON.parse(r.value);
          if (s.users) setUsers(s.users);
          if (s.audits) setAudits(s.audits);
          if (s.tasks) setTasks(s.tasks);
          if (s.activity) setActivity(s.activity);
          if (s.notifications) setNotifications(s.notifications);
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  // Persist state changes
  useEffect(() => {
    if (loading) return;
    window.storage
      .set("portal_v3", JSON.stringify({ users, audits, tasks, activity, notifications }))
      .catch(() => {});
  }, [users, audits, tasks, activity, notifications, loading]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e1b4b", color: "#fff", fontSize: 18, fontFamily: "system-ui" }}>
      🔐 Loading…
    </div>
  );

  if (!user) return <Login onLogin={setUser} users={users} />;

  return (
    <div style={{ minHeight: "100vh", background: th.bg, fontFamily: "system-ui,sans-serif" }}>
      {/* Nav Bar */}
      <div style={{ background: th.nav, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 8px #0003" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
          🔐 CyberAudit{" "}
          <span style={{ background: "#312e81", color: "#a5b4fc", fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>PORTAL</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#a5b4fc", fontSize: 12 }}>{user.name}</span>
          <span style={{ background: user.role === "admin" ? "#6366f1" : "#22c55e", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700, textTransform: "uppercase" }}>
            {user.role}
          </span>
          <button
            onClick={() => setDarkMode(d => !d)}
            style={{ background: "transparent", border: "1px solid #334155", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#a5b4fc", fontSize: 14 }}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={() => setUser(null)}
            style={{ background: "#312e81", color: "#c7d2fe", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      {user.role === "admin" ? (
        <AdminDashboard
          user={user}
          users={users}
          setUsers={setUsers}
          audits={audits}
          setAudits={setAudits}
          tasks={tasks}
          setTasks={setTasks}
          activity={activity}
          setActivity={setActivity}
          notifications={notifications}
          setNotifications={setNotifications}
          th={th}
        />
      ) : (
        <EmployeeDashboard
          user={user}
          audits={audits}
          setAudits={setAudits}
          tasks={tasks}
          setTasks={setTasks}
          setActivity={setActivity}
          notifications={notifications}
          setNotifications={setNotifications}
          th={th}
        />
      )}
    </div>
  );
}
