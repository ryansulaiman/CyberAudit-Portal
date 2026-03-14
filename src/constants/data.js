// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & DATA
// ═══════════════════════════════════════════════════════════════════

export const SECURITY_CHECKS = [
  { id: "password_manager", label: "1Password installed & logged in", task: "Install 1Password", icon: "🔑" },
  { id: "antivirus", label: "Antivirus installed & active", task: "Install & activate antivirus", icon: "🛡️" },
  { id: "os_updated", label: "Operating system updated", task: "Update operating system", icon: "💻" },
];

export const DEPARTMENTS = ["Engineering", "Marketing", "Finance", "HR", "IT", "Sales", "Legal"];

export const DEADLINE = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

export const INIT_USERS = [
  { id: "u1", email: "admin@company.com", name: "Alex Admin", role: "admin", password: "admin123", department: "IT", avatar: "AA" },
  { id: "u2", email: "alice@company.com", name: "Alice Johnson", role: "employee", password: "pass123", department: "Engineering", avatar: "AJ" },
  { id: "u3", email: "bob@company.com", name: "Bob Smith", role: "employee", password: "pass123", department: "Marketing", avatar: "BS" },
  { id: "u4", email: "carol@company.com", name: "Carol White", role: "employee", password: "pass123", department: "Finance", avatar: "CW" },
  { id: "u5", email: "david@company.com", name: "David Brown", role: "employee", password: "pass123", department: "HR", avatar: "DB" },
];

export const INIT_AUDITS = [
  { id: "a1", userId: "u2", version: 1, deviceType: "Mac", deviceModel: "MacBook Pro 14\"", serialNumber: "C02XG2JH", osVersion: "macOS Sonoma 14.3", checks: { password_manager: "yes", antivirus: "yes", os_updated: "yes" }, screenshots: { password_manager: { name: "1pass.png", dataUrl: "" }, antivirus: { name: "av.png", dataUrl: "" }, os_updated: { name: "os.png", dataUrl: "" } }, submittedAt: "2026-02-20T10:22:00Z", status: "approved" },
  { id: "a2", userId: "u3", version: 1, deviceType: "Windows", deviceModel: "Dell XPS 15", serialNumber: "8F3K2M1", osVersion: "Windows 11 23H2", checks: { password_manager: "no", antivirus: "yes", os_updated: "yes" }, screenshots: { antivirus: { name: "av.png", dataUrl: "" }, os_updated: { name: "os.png", dataUrl: "" } }, submittedAt: "2026-02-22T14:05:00Z", status: "pending_review" },
  { id: "a3", userId: "u4", version: 1, deviceType: "Windows", deviceModel: "Lenovo ThinkPad", serialNumber: "PF2KQR9", osVersion: "Windows 10 22H2", checks: { password_manager: "yes", antivirus: "no", os_updated: "no" }, screenshots: { password_manager: { name: "1pass.png", dataUrl: "" } }, submittedAt: "2026-02-25T09:15:00Z", status: "rejected", rejectedReason: "Screenshots missing for failed checks." },
];

export const initTasks = (audits) => {
  const tasks = []; let n = 1;
  audits.forEach(a => {
    SECURITY_CHECKS.forEach(c => {
      if (a.checks[c.id] === "no") tasks.push({ id: `t${n++}`, userId: a.userId, auditId: a.id, checkId: c.id, label: c.task, status: "pending", priority: "high", assignedTo: "u1", createdAt: a.submittedAt, comments: [], dueDate: DEADLINE });
    });
  });
  return tasks;
};

export const INIT_ACTIVITY = [
  { id: "ac1", userId: "u1", action: "approved audit", target: "Alice Johnson", timestamp: "2026-02-21T11:00:00Z" },
  { id: "ac2", userId: "u1", action: "rejected audit", target: "Carol White", timestamp: "2026-02-26T10:00:00Z" },
];

export const INIT_NOTIFS = {
  u2: [{ id: "n1", text: "Your audit has been approved ✅", read: false, time: "2026-02-21T11:00:00Z" }],
  u3: [{ id: "n2", text: "Your audit is pending review", read: false, time: "2026-02-22T14:05:00Z" }],
  u4: [{ id: "n3", text: "Your audit was rejected — please resubmit", read: false, time: "2026-02-26T10:00:00Z" }],
  u5: [{ id: "n4", text: "⚠️ You haven't submitted your security audit yet!", read: false, time: "2026-03-05T09:00:00Z" }],
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

export const scoreAudit = c => Math.round((SECURITY_CHECKS.filter(x => c[x.id] === "yes").length / SECURITY_CHECKS.length) * 100);
export const riskOf = s => s === 100 ? "secure" : s >= 67 ? "warning" : "danger";
export const fmt = iso => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const fmtTime = iso => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
export const daysLeft = iso => Math.ceil((new Date(iso) - Date.now()) / 86400000);
export const makeAvatar = name => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
export const uid = () => `u${Date.now()}${Math.floor(Math.random() * 1000)}`;
