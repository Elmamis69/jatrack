import { useEffect, useMemo, useState } from "react";
import type { Application } from "../api";
import { listApplications, updateApplication } from "../api";
import { useAuth } from "../auth/AuthContext";
import "./kanban.css"; //  nuevo

type Status = Application["status"];
const STATUSES: Status[] = ["APPLIED", "HR_SCREEN", "TECH_TEST", "INTERVIEW", "OFFER", "REJECTED"];

export default function Kanban() {
  const { logout } = useAuth();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<Status | null>(null); // 👈 para resaltar columna

  async function refresh() {
    setLoading(true);
    try {
      const data = await listApplications({ size: 1000, sort: "appliedDate,desc" });
      setItems(Array.isArray(data) ? data : data.content);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const byStatus = useMemo(() => {
    const map = new Map<Status, Application[]>();
    STATUSES.forEach(s => map.set(s, []));
    for (const a of items) {
      const s = (a.status as Status) ?? "APPLIED";
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(a);
    }
    return map;
  }, [items]);

  function onDragStart(e: React.DragEvent, id: number) {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault(); // necesario para permitir drop
  }

  function onDragEnter(status: Status) {
    setHoverCol(status);
  }
  function onDragLeave() {
    setHoverCol(null);
  }

  async function onDrop(e: React.DragEvent, newStatus: Status) {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain");
    const id = Number(idStr || draggingId);
    setDraggingId(null);
    setHoverCol(null);
    if (!id) return;

    const card = items.find(a => a.id === id);
    if (!card) return;

    // optimistic UI
    const prev = items;
    const next = items.map(a => (a.id === id ? { ...a, status: newStatus } : a));
    setItems(next);

    try {
      await updateApplication(id, {
        company: card.company,
        roleTitle: card.roleTitle,
        status: newStatus,
        appliedDate: card.appliedDate ?? new Date().toISOString().slice(0,10),
        contactEmail: card.contactEmail ?? "",
        jobUrl: card.jobUrl ?? "",
        notes: card.notes ?? "",
      });
    } catch (err) {
      console.error("PUT /api/applications failed:", err);
      setItems(prev);
      alert("No se pudo actualizar el estado");
    }
  }

  return (
    <div className="board">
      <div className="board__header">
        <h2 className="board__title">JATrack – Kanban</h2>
        <div className="board__actions">
          <button className="btn btn--ghost" onClick={() => (window.location.href = "/")}>← List</button>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="columns">
        {STATUSES.map((status) => {
          const colItems = byStatus.get(status) ?? [];
          const isHover = hoverCol === status;
          return (
            <section
              key={status}
              className={`col ${isHover ? "col--hover" : ""}`}
              onDragOver={onDragOver}
              onDragEnter={() => onDragEnter(status)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, status)}
            >
              <header className="col__head">
                <div className="col__title">{status.replace("_", " ")}</div>
                <span className="col__count">{colItems.length}</span>
              </header>

              <div className="col__body">
                {loading ? (
                  <div className="empty">Loading…</div>
                ) : colItems.length === 0 ? (
                  <div className="empty">Drop here</div>
                ) : (
                  colItems.map(a => (
                    <article
                      key={a.id}
                      className="card"
                      draggable
                      onDragStart={(e) => onDragStart(e, a.id!)}
                    >
                      <h4 className="card__company">{a.company}</h4>
                      <div className="card__role">{a.roleTitle}</div>
                      <div className="card__date">{a.appliedDate}</div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
