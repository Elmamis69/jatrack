import { useEffect, useMemo, useState } from "react";
import { createApplication, deleteApplication, listApplications } from "../api";
import type { Application } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useDebounce } from "../utils/useDebounce";
import { buildCsv, downloadCsv, type ColumnDef } from "../utils/csv"; //  NUEVO
// NUEVO import
import { exportTablePdf, type PdfColumn } from "../utils/pdf";

export default function Applications() {
  const { logout } = useAuth();

  const [apps, setApps] = useState<Application[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // filtros
  const [status, setStatus] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 350);
  const [sort, setSort] = useState<string>("appliedDate,desc");

  // flag simple de carga
  const [loading, setLoading] = useState(true);

  async function refresh(p = page, keepPage = true) {
    const token = localStorage.getItem("token");
    if (!token) { setTimeout(() => refresh(p, keepPage), 200); return; }

    try {
      setLoading(true);
      const data = await listApplications({
        page: p,
        size,
        status: status || undefined,
        query: debouncedQuery || undefined,
        sort,
      });

      if (Array.isArray(data)) {
        setApps(data);
        setTotalPages(1);
        setTotalElements(data.length);
        if (!keepPage) setPage(0);
      } else {
        setApps(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        if (!keepPage) setPage(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // carga inicial
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    refresh(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cuando cambian filtros/sort/tamaño → ir a página 0
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    refresh(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedQuery, sort, size]);

  async function handleAdd() {
    const token = localStorage.getItem("token");
    if (!token) return;
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
    await refresh(0, false);
  }

  async function handleDelete(id: number) {
    const token = localStorage.getItem("token");
    if (!token) return;
    await deleteApplication(id);
    const nextPage = (apps.length === 1 && page > 0) ? page - 1 : page;
    setPage(nextPage);
    await refresh(nextPage, true);
  }

  function toggleSort() {
    setSort(prev => prev === "appliedDate,desc" ? "appliedDate,asc" : "appliedDate,desc");
  }

  const disabledPrev = useMemo(() => page <= 0, [page]);
  const disabledNext = useMemo(() => page >= totalPages - 1, [page, totalPages]);

  // 👇 NUEVO: Export CSV de lo que el usuario está viendo (apps ya filtradas/paginadas)
  function onExportCsv() {
    const columns: ColumnDef<Application>[] = [
      { header: "ID", accessor: r => r.id ?? "" },
      { header: "Company", accessor: r => r.company },
      { header: "Role Title", accessor: r => r.roleTitle },
      { header: "Status", accessor: r => r.status },
      { header: "Applied Date", accessor: r => r.appliedDate ?? "" },
      { header: "Contact Email", accessor: r => r.contactEmail ?? "" },
      { header: "Job URL", accessor: r => r.jobUrl ?? "" },
      { header: "Notes", accessor: r => (r.notes ?? "").replace(/\r?\n/g, " ") },
    ];
    const csv = buildCsv(apps, columns);
    const yyyyMmDd = new Date().toISOString().slice(0, 10);
    downloadCsv(`applications_${yyyyMmDd}`, csv);
  }
  function onExportPdf() {
    // columnas y mapeo de valores tal como en CSV
    const columns: PdfColumn<Application>[] = [
      { header: "ID", accessor: r => r.id ?? "", width: 16 },
      { header: "Company", accessor: r => r.company, width: 40 },
      { header: "Role Title", accessor: r => r.roleTitle, width: 40 },
      { header: "Status", accessor: r => r.status, width: 26 },
      { header: "Applied Date", accessor: r => r.appliedDate ?? "", width: 26 },
      { header: "Contact Email", accessor: r => r.contactEmail ?? "", width: 40 },
      // Si la URL es larga, la recortamos para que envuelva mejor:
      { header: "Job URL", accessor: r => (r.jobUrl ?? ""), width: 50 },
      // Para Notes, quitamos saltos largos o dejamos que haga linebreak
      { header: "Notes", accessor: r => (r.notes ?? ""), width: 60 },
    ];

    const yyyyMmDd = new Date().toISOString().slice(0, 10);
    exportTablePdf<Application>({
      rows: apps,
      columns,
      title: "Applications",
      fileName: `applications_${yyyyMmDd}`,
      landscape: true, // más columnas = mejor en horizontal
    });
  }


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
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16
      }}>
        <h2>JATrack – Applications</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => (window.location.href = "/kanban")}
            style={{ fontSize: "20px", fontWeight: "bold" }}
          >
            Kanban
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Filtros */}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 180px 160px 120px auto auto", marginBottom: 12 }}>
        <input
          placeholder="Search (company, role, notes…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="APPLIED">APPLIED</option>
          <option value="HR_SCREEN">HR_SCREEN</option>
          <option value="TECH_TEST">TECH_TEST</option>
          <option value="INTERVIEW">INTERVIEW</option>
          <option value="OFFER">OFFER</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <button onClick={toggleSort}>
          {sort === "appliedDate,desc" ? "Date ↓" : "Date ↑"}
        </button>

        <select value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))}>
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
        </select>

        <button onClick={handleAdd} disabled={loading}>+ Quick add</button>

        {/*  NUEVO: Export CSV */}
        <button onClick={onExportCsv} disabled={loading}>Export CSV</button>
        <button onClick={onExportPdf} disabled={loading}>Export PDF</button>
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
          onClick={() => { const p = Math.max(0, page - 1); setPage(p); refresh(p, true); }}
        >
          Prev
        </button>
        <span>Page {page + 1} / {Math.max(1, totalPages)} — {totalElements} total</span>
        <button
          disabled={loading || disabledNext}
          onClick={() => { const p = page + 1; setPage(p); refresh(p, true); }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
