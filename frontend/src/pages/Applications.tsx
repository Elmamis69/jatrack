import { useEffect, useMemo, useState } from "react";
import { createApplication, deleteApplication, listApplications } from "../api";
import type { Application } from "../api";
import { useAuth } from "../auth/AuthContext";

export default function Applications() {
  const { logout } = useAuth();

  const [apps, setApps] = useState<Application[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // filtros
  const [status, setStatus] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [sort, setSort] = useState<string>("appliedDate,desc");

  // flag simple de carga
  const [loading, setLoading] = useState(true);

  async function refresh(p = page) {
    const token = localStorage.getItem("token");

    //  Si aún no hay token, reintenta en breve (evita GET sin auth)
    if (!token) {
      setLoading(true);
      setTimeout(() => refresh(p), 200);
      return;
    }
 
    try {
      setLoading(true);
      const data = await listApplications({ page: p, size, status, query, sort });
      if (Array.isArray(data)) {
        setApps(data);
        setTotalPages(1);
      } else {
        setApps(data.content);
        setTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // carga inicial una vez haya token
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    refresh(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cuando cambian filtros/sort, refresca desde la página 0… pero solo si hay token
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    refresh(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, query, sort]);

  async function handleAdd() {
    const token = localStorage.getItem("token");
    if (!token) return; // por seguridad
    const today = new Date().toISOString().slice(0, 10);
    await createApplication({
      company: "Example Inc",
      roleTitle: "Full Stack Dev",
      status: "APPLIED",
      appliedDate: today,
      contactEmail: "hr@example.com",
      jobUrl: "https://example.com/job",
      notes: "Added from UI",
    });
    await refresh(0);
  }

  async function handleDelete(id: number) {
    const token = localStorage.getItem("token");
    if (!token) return; // por seguridad
    await deleteApplication(id);
    await refresh(page);
  }

  const disabledPrev = useMemo(() => page <= 0, [page]);
  const disabledNext = useMemo(() => page >= totalPages - 1, [page, totalPages]);

  // UI mínima mientras aún no hay token o estamos cargando
  if (!localStorage.getItem("token")) {
    return (
      <div style={{ padding: 16, maxWidth: 1040, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2>JATrack – Applications</h2>
          <button onClick={logout}>Logout</button>
        </header>
        <div>Preparando sesión…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 1040, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>JATrack – Applications</h2>
        <button onClick={logout}>Logout</button>
      </header>

      {/* Filtros */}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr auto", marginBottom: 12 }}>
        <input placeholder="Search (company, role, notes…)" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="APPLIED">APPLIED</option>
          <option value="INTERVIEW">INTERVIEW</option>
          <option value="OFFER">OFFER</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="appliedDate,desc">Date ↓</option>
          <option value="appliedDate,asc">Date ↑</option>
        </select>
        <button onClick={handleAdd} disabled={loading}>+ Quick add</button>
      </div>

      {/* Tabla */}
      <div style={{ overflow: "auto", border: "1px solid #eee", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Company</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Role</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Status</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Date</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 12, textAlign: "center" }}>Loading…</td></tr>
            ) : apps.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 12, textAlign: "center" }}>No records</td></tr>
            ) : apps.map(a => (
              <tr key={a.id!}>
                <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>{a.company}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>{a.roleTitle}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>{a.status}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>{a.appliedDate}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f2f2f2" }}>
                  <button onClick={() => handleDelete(a.id!)} disabled={loading}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        <button
          disabled={loading || disabledPrev}
          onClick={() => { const p = Math.max(0, page - 1); setPage(p); refresh(p); }}
        >
          Prev
        </button>
        <span>Page {page + 1} / {Math.max(1, totalPages)}</span>
        <button
          disabled={loading || disabledNext}
          onClick={() => { const p = page + 1; setPage(p); refresh(p); }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
