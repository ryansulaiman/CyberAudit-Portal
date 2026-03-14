import { Modal, Btn } from "./ui";

// ═══════════════════════════════════════════════════════════════════
// DELETE CONFIRM MODAL
// ═══════════════════════════════════════════════════════════════════

export default function DeleteModal({ th, employee, onConfirm, onClose }) {
  return (
    <Modal th={th} title="🗑️ Remove Employee" onClose={onClose} width={400}>
      <div style={{ fontSize: 14, color: th.text, marginBottom: 20 }}>
        Are you sure you want to remove <strong>{employee.name}</strong>? This will also delete their audit and tasks.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn th={th} variant="danger" onClick={onConfirm}>Yes, Remove</Btn>
        <Btn th={th} variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
}
