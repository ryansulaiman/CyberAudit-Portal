import { useState } from "react";
import { DEPARTMENTS, makeAvatar, uid } from "../constants/data";
import { Modal, Btn, Inp, Sel } from "./ui";

// ═══════════════════════════════════════════════════════════════════
// EMPLOYEE MANAGEMENT MODAL
// ═══════════════════════════════════════════════════════════════════

export default function EmployeeModal({ th, mode, employee, onSave, onClose }) {
  const [form, setForm] = useState(
    employee || { name: "", email: "", password: "pass123", department: "Engineering", role: "employee" }
  );
  const [err, setErr] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErr("Name, email, and password are required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setErr("Invalid email address.");
      return;
    }
    onSave({ ...form, id: employee?.id || uid(), avatar: makeAvatar(form.name) });
  };

  return (
    <Modal th={th} title={mode === "add" ? "➕ Add Employee" : "✏️ Edit Employee"} onClose={onClose}>
      {[["Full Name", "name", "text"], ["Email", "email", "email"], ["Password", "password", "text"]].map(([lbl, key, type]) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: th.sub, display: "block", marginBottom: 4 }}>
            {lbl} <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <Inp th={th} type={type} value={form[key] || ""} onChange={e => set(key, e.target.value)} />
        </div>
      ))}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: th.sub, display: "block", marginBottom: 4 }}>Department</label>
        <Sel th={th} value={form.department} onChange={e => set("department", e.target.value)}>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </Sel>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: th.sub, display: "block", marginBottom: 4 }}>Role</label>
        <Sel th={th} value={form.role} onChange={e => set("role", e.target.value)}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </Sel>
      </div>
      {err && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn th={th} variant="success" onClick={save}>{mode === "add" ? "Add Employee" : "Save Changes"}</Btn>
        <Btn th={th} variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}
