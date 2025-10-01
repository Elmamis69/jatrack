import { useEffect, useMemo, useState } from 'react';
import type { Application } from './api';
import { STATUS_OPTIONS, searchApplications, createApplication, updateApplication, deleteApplication } from './api';
import ApplicationForm from './components/ApplicationForm';

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const [items, setItems] = useState<Application[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [status, setStatus] = useState<Application['status'] | ''>('');
  const [q, setQ] = useState('');
  const qDebounced = useDebounced(q, 400);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Application | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filters = useMemo(() => ({ status: status || undefined, q: qDebounced || undefined }), [status, qDebounced]);

  async function load(p = page, s = size) {
    setLoading(true);
    try {
      const data = await searchApplications({ ...filters, page: p, size: s, sort: 'appliedDate,desc' });
      setItems(data.content);
      setPage(data.page);
      setSize(data.size);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(0, size); }, [filters]); // cambiar filtros regresa a page 0
  useEffect(() => { load(page, size); }, [page, size]); // cambio de página o tamaño

  async function handleCreate(data: Application) {
    await createApplication(data);
    setShowCreate(false);
    load(0, size);
  }

  async function handleUpdate(data: Application) {
    if (!editing?.id) return;
    await updateApplication(editing.id, data);
    setEditing(null);
    load(page, size);
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    await deleteApplication(id);
    load(page, size);
  }

  const card = { padding: 16, border: '1px solid #333', borderRadius: 12, background: '#141414' } as const;
  const input = { padding: 8, background: '#1f1f1f', color: '#eee', border: '1px solid #333', borderRadius: 6 } as const;

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto', color: '#eee' }}>
      <h1 style={{ marginBottom: 12 }}>JATrack</h1>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Search (company, role, notes, email)"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ ...input, minWidth: 320 }}
        />
        <select value={status} onChange={e => setStatus(e.target.value as any)} style={input}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={size} onChange={e => setSize(Number(e.target.value))} style={input}>
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
        {!showCreate && !editing && <button onClick={() => setShowCreate(true)}>Add application</button>}
      </div>

      {showCreate && (
        <div style={{ ...card, margin: '12px 0' }}>
          <h3>Create application</h3>
          <ApplicationForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {editing && (
        <div style={{ ...card, margin: '12px 0' }}>
          <h3>Edit application</h3>
          <ApplicationForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </div>
      )}

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {loading ? (
        <p style={{ padding: 16 }}>Loading…</p>
      ) : (
        <>
          <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>Company</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>Role</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>Status</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>Applied</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id}>
                  <td style={{ padding: '6px 0' }}>{a.company}</td>
                  <td>{a.roleTitle}</td>
                  <td>{a.status}</td>
                  <td>{a.appliedDate ?? '-'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditing(a)}>Edit</button>
                    <button onClick={() => handleDelete(a.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 8, color: '#888' }}>No results.</td></tr>
              )}
            </tbody>
          </table>

          {/* Paginación */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <button disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</button>
            <span>Page {page + 1} / {Math.max(totalPages, 1)}</span>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
