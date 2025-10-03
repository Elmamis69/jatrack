import { useEffect, useMemo, useState } from "react";
import { createApplication, deleteApplication, listApplications } from "../api";
import type { Application } from "../api";
import { STATUS_OPTIONS } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useDebounce } from "../utils/useDebounce";
import { buildCsv, downloadCsv, type ColumnDef } from "../utils/csv";
import { exportTablePdf, type PdfColumn } from "../utils/pdf";
import "./applications.css"; //  nuevo

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

  const [loading, setLoading] = useState(true);

  // --- estado modal Add ---
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function initialDraft(): Partial<Application> {
    return {
      company: "",
      roleTitle: "",
      status: "APPLIED",
      appliedDate: new Date().toISOString().slice(0, 10),
      contactEmail: "",
      jobUrl: "",
      notes: "",
    };
  }
  const [draft, setDraft] = useState<Partial<Application>>(initialDraft());

  function openAdd() {
    setDraft(initialDraft());
    setFormError(null);
    setShowAdd(true);
  }
  function closeAdd() {
    if (saving) return;
    setShowAdd(false);
  }

  function setDraftField<K extends keyof Application>(key: K, value: Application[K]) {
    setDraft(d => ({ ...d, [key]: value }));
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const company = (draft.company ?? "").trim();
    const roleTitle = (draft.roleTitle ?? "").trim();
    if (!company || !roleTitle) {
      setFormError("Company and Role Title are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createApplication({
        company,
        roleTitle,
        status: (draft.status as string) || "APPLIED",
        appliedDate: draft.appliedDate ?? new Date().toISOString().slice(0, 10),
        contactEmail: draft.contactEmail ?? "",
        jobUrl: draft.jobUrl ?? "",
        notes: draft.notes ?? "",
      });
      setShowAdd(false);
      await refresh(0, false);
    } catch (err) {
      console.error(err);
      setFormError("Failed to create application. Please try again.");
    } finally {
      setSaving(false);
    }
  }


  async function refresh(p = page, keepPage = true) {
    const token = localStorage.getItem("token");
    if (!token) { setTimeout(() => refresh(p, keepPage), 200); return; }

    try {
      setLoading(true);
      const data = await listApplications({
        page: p,
        size,
        status: status || undefined,
        q: debouncedQuery || undefined,
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

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    refresh(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const columns: PdfColumn<Application>[] = [
      { header: "ID", accessor: r => r.id ?? "", width: 16 },
      { header: "Company", accessor: r => r.company, width: 40 },
      { header: "Role Title", accessor: r => r.roleTitle, width: 40 },
      { header: "Status", accessor: r => r.status, width: 26 },
      { header: "Applied Date", accessor: r => r.appliedDate ?? "", width: 26 },
      { header: "Contact Email", accessor: r => r.contactEmail ?? "", width: 40 },
      { header: "Job URL", accessor: r => r.jobUrl ?? "", width: 50 },
      { header: "Notes", accessor: r => r.notes ?? "", width: 60 },
    ];
    const yyyyMmDd = new Date().toISOString().slice(0, 10);
    exportTablePdf<Application>({
      rows: apps,
      columns,
      title: "Applications",
      fileName: `applications_${yyyyMmDd}`,
      landscape: true,
    });
  }

  if (!localStorage.getItem("token")) {
    return (
      <div className="page">
        <div className="page__header">
          <h2 className="page__title">JATrack – Applications</h2>
          <div className="page__actions">
            <button className="btn" onClick={logout}>Logout</button>
          </div>
        </div>
        <div>Preparando sesión…</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">JATrack – Applications</h2>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => (window.location.href = "/kanban")}>
            Kanban
          </button>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search (company, role, notes…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="APPLIED">APPLIED</option>
          <option value="HR_SCREEN">HR_SCREEN</option>
          <option value="TECH_TEST">TECH_TEST</option>
          <option value="INTERVIEW">INTERVIEW</option>
          <option value="OFFER">OFFER</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <button className="btn" onClick={toggleSort}>
          {sort === "appliedDate,desc" ? "Date ↓" : "Date ↑"}
        </button>

        <select className="select" value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))}>
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
        </select>

        <button className="btn3" onClick={handleAdd} disabled={loading}>+ Quick add</button>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn2" onClick={openAdd} disabled={loading}>Add…</button>
          <button className="btn1" onClick={onExportCsv} disabled={loading}>Export CSV</button>
          <button className="btn btn--primary" onClick={onExportPdf} disabled={loading}>Export PDF</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 12, textAlign: "center" }}>Loading…</td></tr>
            ) : apps.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 12, textAlign: "center" }}>No records</td></tr>
            ) : apps.map(a => (
              <tr key={a.id!}>
                <td>{a.company}</td>
                <td>{a.roleTitle}</td>
                <td><span className="badge">{a.status}</span></td>
                <td>{a.appliedDate}</td>
                <td>
                  <button className="btn" onClick={() => handleDelete(a.id!)} disabled={loading}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="pager">
        <button
          className="btn"
          disabled={loading || disabledPrev}
          onClick={() => { const p = Math.max(0, page - 1); setPage(p); refresh(p, true); }}
        >
          Prev
        </button>
        <span className="pager__info">Page {page + 1} / {Math.max(1, totalPages)} — {totalElements} total</span>
        <button
          className="btn"
          disabled={loading || disabledNext}
          onClick={() => { const p = page + 1; setPage(p); refresh(p, true); }}
        >
          Next
        </button>
      </div>
      {/* --- Modal Add Application --- */}
      {showAdd && (
        <div className="modalOverlay" onClick={closeAdd}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Add Application</h3>
              <button className="btn" onClick={closeAdd} disabled={saving}>✕</button>
            </div>

            <form onSubmit={submitAdd}>
              <div className="modal__body">
                {formError && <div className="formError">{formError}</div>}

                <div className="formGrid">
                  <div>
                    <label>Company</label>
                    <input
                      className="input"
                      value={draft.company ?? ""}
                      onChange={(e) => setDraftField("company", e.target.value)}
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label>Role Title</label>
                    <input
                      className="input"
                      value={draft.roleTitle ?? ""}
                      onChange={(e) => setDraftField("roleTitle", e.target.value)}
                      placeholder="e.g., Full Stack Developer"
                    />
                  </div>

                  <div>
                    <label>Status</label>
                    <select
                      className="select"
                      value={(draft.status as string) ?? "APPLIED"}
                      onChange={(e) => setDraftField("status", e.target.value as Application["status"])}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Applied Date</label>
                    <input
                      className="input"
                      type="date"
                      value={draft.appliedDate ?? ""}
                      onChange={(e) => setDraftField("appliedDate", e.target.value)}
                    />
                  </div>

                  <div>
                    <label>Contact Email</label>
                    <input
                      className="input"
                      type="email"
                      value={draft.contactEmail ?? ""}
                      onChange={(e) => setDraftField("contactEmail", e.target.value)}
                      placeholder="hr@example.com"
                    />
                  </div>

                  <div>
                    <label>Job URL</label>
                    <input
                      className="input"
                      type="url"
                      value={draft.jobUrl ?? ""}
                      onChange={(e) => setDraftField("jobUrl", e.target.value)}
                      placeholder="https://example.com/job"
                    />
                  </div>
                </div>

                <div className="formGrid formGrid--1col" style={{ marginTop: 10 }}>
                  <div>
                    <label>Notes</label>
                    <textarea
                      className="textarea"
                      value={draft.notes ?? ""}
                      onChange={(e) => setDraftField("notes", e.target.value)}
                      placeholder="Extra details, contacts, reminders…"
                    />
                  </div>
                </div>
              </div>

              <div className="modal__actions">
                <button type="button" className="btn" onClick={closeAdd} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
