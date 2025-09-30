import { useEffect, useState } from 'react';
import type { Application } from './api';
import { listApplications, createApplication, updateApplication, deleteApplication } from './api';
import ApplicationForm from './components/ApplicationForm';

export default function App() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Application | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    listApplications()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(data: Application) {
    try {
      const created = await createApplication(data);
      setItems(prev => [...prev, created]);
      setShowCreate(false);
    } catch (e:any) { setError(e.message); }
  }

  async function handleUpdate(data: Application) {
    if (!editing?.id) return;
    try {
      const updated = await updateApplication(editing.id, data);
      setItems(prev => prev.map(x => x.id === editing.id ? updated : x));
      setEditing(null);
    } catch (e:any) { setError(e.message); }
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    await deleteApplication(id);
    setItems(prev => prev.filter(x => x.id !== id));
  }

  if (loading) return <p style={{padding:16}}>Loading…</p>;

  const card = { padding:16, border:'1px solid #333', borderRadius:12, background:'#141414' } as const;

  return (
    <div style={{padding: 16, maxWidth: 1000, margin: '0 auto', color:'#eee'}}>
      <h1 style={{marginBottom:12}}>JATrack</h1>

      {!showCreate && !editing && (
        <button onClick={() => setShowCreate(true)}>Add application</button>
      )}

      {showCreate && (
        <div style={{...card, margin:'12px 0'}}>
          <h3>Create application</h3>
          <ApplicationForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {editing && (
        <div style={{...card, margin:'12px 0'}}>
          <h3>Edit application</h3>
          <ApplicationForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </div>
      )}

      {error && <p style={{color:'crimson'}}>{error}</p>}

      <table style={{width:'100%', marginTop:16, borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', borderBottom:'1px solid #333'}}>Company</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #333'}}>Role</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #333'}}>Status</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #333'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(a => (
            <tr key={a.id}>
              <td style={{padding:'6px 0'}}>{a.company}</td>
              <td>{a.roleTitle}</td>
              <td>{a.status}</td>
              <td style={{display:'flex', gap:8}}>
                <button onClick={() => setEditing(a)}>Edit</button>
                <button onClick={() => handleDelete(a.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={4} style={{padding:8, color:'#888'}}>No applications yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
