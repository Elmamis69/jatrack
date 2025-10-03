import { useEffect, useMemo, useState } from "react";
import { listAllApplications, updateApplication, STATUS_OPTIONS, type Application } from "../api";
import { useAuth } from "../auth/AuthContext";

const COLUMNS: readonly (typeof STATUS_OPTIONS[number])[] = [
  "APPLIED", "HR_SCREEN", "TECH_TEST", "INTERVIEW", "OFFER", "REJECTED",
];

export default function Kanban() {
  const { logout } = useAuth();
  const [items, setItems] = useState<Application[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const all = await listAllApplications();
      setItems(all);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const map: Record<string, Application[]> = {};
    for (const col of COLUMNS) map[col] = [];
    for (const a of items) {
      const s = (a.status as string) || "APPLIED";
      if (!map[s]) map[s] = [];
      map[s].push(a);
    }
    return map;
  }, [items]);

  function onDragStart(e: React.DragEvent, id: number) {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault(); // permitir drop
    e.dataTransfer.dropEffect = "move";
  }
  // helper para mostrar fecha bonita
  function fmtDate(d?: string) {
    if (!d) return "—";
    // si d ya viene como "2025-10-02", úsala tal cual o formatea:
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  }


  async function onDrop(e: React.DragEvent, newStatus: Application["status"]) {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain");
    const id = Number(idStr || draggingId);
    setDraggingId(null);
    if (!id) return;

    // Busca la tarjeta actual
    const card = items.find(a => a.id === id);
    if (!card) return;

    // Optimistic UI (mover en la UI primero)
    const prev = items;
    const next = items.map(a => (a.id === id ? { ...a, status: newStatus } : a));
    setItems(next);

    try {
      // 👇 Enviar el objeto completo (no sólo status)
      await updateApplication(id, {
        company: card.company,
        roleTitle: card.roleTitle,
        status: newStatus,
        appliedDate: card.appliedDate,     // asegúrate que no sea undefined
        contactEmail: card.contactEmail ?? "",
        jobUrl: card.jobUrl ?? "",
        notes: card.notes ?? "",
      });
    } catch (err) {
      console.error("PUT /api/applications failed:", err);
      setItems(prev); // revertir si falla
      alert("No se pudo actualizar el estado");
    }
  }


  function goList() {
    window.location.href = "/"; // sin router: volver al listado
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>JATrack – Kanban</h2>
          <button onClick={goList}>← List</button>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`,
          gap: 12,
          minHeight: 400,
        }}>
          {COLUMNS.map(col => (
            <div key={col}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col)}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#fafafa",
                padding: 8,
                minHeight: 300
              }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{col}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {grouped[col].map(card => (
                  <div key={card.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, card.id!)}
                    style={{
                      background: "#fff",
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 8,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      cursor: "grab"
                    }}>
                    <div style={{ fontWeight: 600 }}>{card.company}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{card.roleTitle}</div>
                    <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                      {fmtDate(card.appliedDate ?? new Date().toISOString().slice(0, 10))}
                    </div>
                  </div>
                ))}
                {grouped[col].length === 0 && (
                  <div style={{ color: "#999", fontSize: 12, textAlign: "center", padding: 8 }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
