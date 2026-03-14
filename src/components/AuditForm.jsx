import { useState, useRef } from "react";
import { SECURITY_CHECKS, DEADLINE, fmt, daysLeft } from "../constants/data";
import { RB } from "../styles/theme";
import { Card, Btn, Inp, Sel } from "./ui";

// ═══════════════════════════════════════════════════════════════════
// AUDIT FORM
// ═══════════════════════════════════════════════════════════════════

export default function AuditForm({ user, audits, setAudits, tasks, setTasks, setActivity, setNotifications, onDone, th }) {
  const existing = audits.find(a => a.userId === user.id && a.status !== "rejected");
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState(
    existing
      ? { deviceType: existing.deviceType, deviceModel: existing.deviceModel, serialNumber: existing.serialNumber, osVersion: existing.osVersion }
      : { deviceType: "", deviceModel: "", serialNumber: "", osVersion: "" }
  );
  const [checks, setChecks] = useState(existing ? { ...existing.checks } : {});
  const [screenshots, setScreenshots] = useState(existing?.screenshots || {});
  const [submitted, setSubmitted] = useState(false);
  const fileRefs = useRef({});

  const handleFile = (id, e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setScreenshots(s => ({ ...s, [id]: { name: f.name, dataUrl: ev.target.result } }));
    reader.readAsDataURL(f);
  };

  const screenshotRequired = (id) => checks[id] === "yes";
  const screenshotMissing = SECURITY_CHECKS.filter(c => screenshotRequired(c.id) && !screenshots[c.id]);
  const allChecksAnswered = SECURITY_CHECKS.every(c => checks[c.id]);
  const canSubmit = allChecksAnswered && screenshotMissing.length === 0;

  const handleSubmit = () => {
    const ver = existing ? (existing.version || 1) + 1 : 1;
    const audit = {
      id: existing ? existing.id : `a${Date.now()}`,
      userId: user.id,
      version: ver,
      ...device,
      checks,
      screenshots,
      submittedAt: new Date().toISOString(),
      status: "pending_review",
    };
    setAudits(prev => [...prev.filter(a => a.userId !== user.id), audit]);
    const newTasks = SECURITY_CHECKS.filter(c => checks[c.id] === "no").map(c => ({
      id: `t${Date.now()}${Math.random()}`,
      userId: user.id,
      auditId: audit.id,
      checkId: c.id,
      label: c.task,
      status: "pending",
      priority: "high",
      assignedTo: "u1",
      createdAt: new Date().toISOString(),
      comments: [],
      dueDate: DEADLINE,
    }));
    setTasks(prev => [...prev.filter(t => t.userId !== user.id), ...newTasks]);
    setActivity(prev => [{ id: `ac${Date.now()}`, userId: user.id, action: "submitted audit", target: "Self", timestamp: new Date().toISOString() }, ...prev]);
    setNotifications(prev => ({
      ...prev,
      u1: [{ id: `n${Date.now()}`, text: `${user.name} submitted an audit for review`, read: false, time: new Date().toISOString() }, ...(prev.u1 || [])],
    }));
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ textAlign: "center", padding: 60, color: th.text }}>
      <div style={{ fontSize: 60 }}>✅</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 12 }}>Audit Submitted for Review!</div>
      <div style={{ color: th.sub, marginTop: 8 }}>An admin will review your submission shortly.</div>
      <Btn th={th} style={{ marginTop: 24 }} onClick={onDone}>← Back to Dashboard</Btn>
    </div>
  );

  const steps = ["Device Info", "Security Checks", "Review & Submit"];
  const complete0 = device.deviceType && device.deviceModel && device.osVersion;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px", fontFamily: "system-ui,sans-serif", color: th.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>🛡️ Security Self-Audit {existing ? `(Update — v${(existing.version || 1) + 1})` : ""}</div>
        <div style={{ fontSize: 13, color: th.sub }}>Deadline: {fmt(DEADLINE)} ({daysLeft(DEADLINE)} days left)</div>
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              onClick={() => i < step && setStep(i)}
              style={{ flex: 1, padding: "8px 4px", textAlign: "center", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: i < step ? "pointer" : "default", background: step === i ? th.accent : i < step ? "#22c55e" : th.border, color: step === i || i < step ? "#fff" : th.sub }}
            >
              {i < step ? "✓" : i + 1}. {s}
            </div>
          ))}
        </div>
      </div>

      <Card th={th}>
        {/* STEP 0: Device Info */}
        {step === 0 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🖥️ Device Information</div>
            {[["Device Type", "deviceType", ["Mac", "Windows", "Linux"]], ["Device Model", "deviceModel"], ["Serial Number", "serialNumber"], ["OS Version", "osVersion"]].map(([lbl, key, opts]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: th.sub, display: "block", marginBottom: 4 }}>
                  {lbl}{["deviceType", "deviceModel", "osVersion"].includes(key) && <span style={{ color: "#ef4444" }}> *</span>}
                </label>
                {opts
                  ? <Sel th={th} value={device[key]} onChange={e => setDevice(d => ({ ...d, [key]: e.target.value }))}><option value="">Select…</option>{opts.map(o => <option key={o}>{o}</option>)}</Sel>
                  : <Inp th={th} value={device[key]} onChange={e => setDevice(d => ({ ...d, [key]: e.target.value }))} />
                }
              </div>
            ))}
            <Btn th={th} onClick={() => setStep(1)} disabled={!complete0}>Next →</Btn>
          </>
        )}

        {/* STEP 1: Security Checks */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>✅ Security Checks</div>
            <div style={{ fontSize: 12, color: th.sub, marginBottom: 14 }}>📸 Screenshot is <strong>mandatory</strong> for every item marked <strong>Yes</strong>.</div>
            {SECURITY_CHECKS.map(chk => {
              const val = checks[chk.id];
              const needsShot = val === "yes";
              const hasShot = !!screenshots[chk.id];
              const missing = needsShot && !hasShot;
              return (
                <div
                  key={chk.id}
                  style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 10, border: `1.5px solid ${missing ? "#f59e0b" : val === "yes" ? "#86efac" : val === "no" ? "#fca5a5" : th.border}`, background: missing ? "#fffbeb" : val === "yes" ? RB.secure : val === "no" ? RB.danger : th.input }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>{chk.icon} {chk.label}</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {["yes", "no"].map(v => (
                      <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: val === v ? (v === "yes" ? "#16a34a" : "#dc2626") : th.sub }}>
                        <input type="radio" name={chk.id} value={v} checked={val === v} onChange={() => setChecks(c => ({ ...c, [chk.id]: v }))} />
                        {v === "yes" ? "✅ Yes" : "❌ No"}
                      </label>
                    ))}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                      {screenshots[chk.id] && <img src={screenshots[chk.id].dataUrl} alt="proof" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} />}
                      <div>
                        <input type="file" accept="image/*" ref={el => fileRefs.current[chk.id] = el} onChange={e => handleFile(chk.id, e)} style={{ display: "none" }} />
                        <button
                          onClick={() => fileRefs.current[chk.id]?.click()}
                          style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1.5px solid ${missing ? "#f59e0b" : th.border}`, background: missing ? "#fef3c7" : th.card, cursor: "pointer", color: missing ? "#92400e" : th.sub, fontWeight: missing ? 700 : 400 }}
                        >
                          {screenshots[chk.id] ? "📸 Change" : missing ? "⚠️ Upload required" : "📸 Upload proof"}
                        </button>
                      </div>
                    </div>
                  </div>
                  {missing && <div style={{ fontSize: 11, color: "#b45309", marginTop: 8, fontWeight: 600 }}>⚠️ Screenshot required for "Yes" answers.</div>}
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn th={th} variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
              <Btn th={th} onClick={() => setStep(2)} disabled={!allChecksAnswered || screenshotMissing.length > 0}>
                {screenshotMissing.length > 0 ? `Missing ${screenshotMissing.length} screenshot(s)` : "Review →"}
              </Btn>
            </div>
          </>
        )}

        {/* STEP 2: Review & Submit */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Review & Submit</div>
            <div style={{ background: th.input, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13 }}>
              <strong>Device:</strong> {device.deviceType} · {device.deviceModel} · {device.osVersion}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {SECURITY_CHECKS.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: checks[c.id] === "yes" ? RB.secure : RB.danger }}>
                  <span style={{ fontSize: 13 }}>{checks[c.id] === "yes" ? "✅" : "❌"} {c.label}</span>
                  {screenshots[c.id] && <img src={screenshots[c.id].dataUrl} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }} />}
                </div>
              ))}
            </div>
            <div style={{ background: RB.warning, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#78350f", marginBottom: 16 }}>
              ⚠️ By submitting, you confirm these details are accurate.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn th={th} variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
              <Btn th={th} variant="success" onClick={handleSubmit} disabled={!canSubmit}>🚀 Submit Audit</Btn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
