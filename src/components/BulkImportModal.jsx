import { useState, useRef } from "react";
import { makeAvatar, uid } from "../constants/data";
import { RB } from "../styles/theme";
import { Modal, Btn } from "./ui";

// ═══════════════════════════════════════════════════════════════════
// BULK IMPORT MODAL
// ═══════════════════════════════════════════════════════════════════

export default function BulkImportModal({ th, onImport, onClose }) {
  const [preview, setPreview] = useState([]);
  const [err, setErr] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setErr("");
    setPreview([]);
    try {
      const text = await f.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes("name"));
      const emailIdx = headers.findIndex(h => h.includes("email"));
      const deptIdx = headers.findIndex(h => h.includes("dept") || h.includes("department"));
      const passIdx = headers.findIndex(h => h.includes("pass"));

      if (nameIdx === -1 || emailIdx === -1) {
        setErr("CSV must have at least 'name' and 'email' columns.");
        return;
      }

      const rows = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.trim());
        return {
          id: uid(),
          name: cols[nameIdx] || "",
          email: cols[emailIdx] || "",
          department: deptIdx !== -1 ? (cols[deptIdx] || "Engineering") : "Engineering",
          password: passIdx !== -1 ? (cols[passIdx] || "pass123") : "pass123",
          role: "employee",
          avatar: makeAvatar(cols[nameIdx] || "U"),
        };
      }).filter(r => r.name && r.email);

      if (rows.length === 0) { setErr("No valid rows found."); return; }
      setPreview(rows);
    } catch (_) {
      setErr("Failed to parse file. Make sure it's a valid CSV.");
    }
  };

  const doImport = () => {
    setImporting(true);
    setTimeout(() => { onImport(preview); }, 300);
  };

  return (
    <Modal th={th} title="📥 Bulk Import Employees" onClose={onClose} width={620}>
      <div style={{ background: th.input, borderRadius: 10, padding: "14px 16px", marginBottom: 16, fontSize: 13, color: th.sub, lineHeight: 1.7 }}>
        <strong style={{ color: th.text }}>Expected CSV format:</strong><br />
        <code style={{ background: th.border, padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>name,email,department,password</code><br />
        Columns <strong>name</strong> and <strong>email</strong> are required. Others are optional.
      </div>

      <div
        style={{ border: `2px dashed ${th.border}`, borderRadius: 10, padding: "24px", textAlign: "center", marginBottom: 16, cursor: "pointer" }}
        onClick={() => fileRef.current?.click()}
      >
        <input type="file" accept=".csv,.xlsx,.xls" ref={fileRef} onChange={handleFile} style={{ display: "none" }} />
        <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: th.text }}>Click to upload CSV / Excel</div>
        <div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>Supports .csv, .xlsx, .xls</div>
      </div>

      {err && (
        <div style={{ background: RB.danger, borderRadius: 8, padding: "10px 14px", color: "#991b1b", fontSize: 13, marginBottom: 14 }}>
          ❌ {err}
        </div>
      )}

      {preview.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: th.text }}>Preview — {preview.length} employee(s) to import:</div>
          <div style={{ maxHeight: 220, overflowY: "auto", border: `1px solid ${th.border}`, borderRadius: 10, marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: th.input }}>
                  {["Name", "Email", "Department", "Password"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: th.sub, borderBottom: `1px solid ${th.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${th.border}` }}>
                    <td style={{ padding: "7px 10px", color: th.text }}>{r.name}</td>
                    <td style={{ padding: "7px 10px", color: th.sub }}>{r.email}</td>
                    <td style={{ padding: "7px 10px", color: th.sub }}>{r.department}</td>
                    <td style={{ padding: "7px 10px", color: th.sub }}>{r.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn th={th} variant="success" onClick={doImport} disabled={importing}>
              {importing ? "Importing…" : `✅ Import ${preview.length} Employee(s)`}
            </Btn>
            <Btn th={th} variant="ghost" onClick={() => { setPreview([]); setErr(""); }}>Clear</Btn>
          </div>
        </>
      )}

      <div style={{ marginTop: 16, borderTop: `1px solid ${th.border}`, paddingTop: 14 }}>
        <div style={{ fontSize: 12, color: th.sub, marginBottom: 8 }}>📋 Download sample CSV template:</div>
        <Btn
          th={th}
          variant="secondary"
          style={{ fontSize: 12 }}
          onClick={() => {
            const csv = "name,email,department,password\nJohn Doe,john@company.com,Engineering,pass123\nJane Smith,jane@company.com,Marketing,pass123";
            const blob = new Blob([csv], { type: "text/csv" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "employee_template.csv";
            a.click();
          }}
        >
          ⬇️ Download Template
        </Btn>
      </div>
    </Modal>
  );
}
