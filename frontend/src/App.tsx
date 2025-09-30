import { useEffect, useState } from 'react';
import { listApplications, createApplication, deleteApplication } from './api';
import type { Application } from './api';


export default function App() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listApplications()
      .then(data => setItems(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    try {
      const created = await createApplication({
        company: 'TestCo',
        roleTitle: 'Jr Developer',
        status: 'APPLIED',
        notes: 'Created from UI'
      });
      setItems(prev => [...prev, created]);
    } catch (e:any) {
      setError(e.message);
    }
  }

  async function handleDelete(id?: number) {
    if (!id) return;
    try {
      await deleteApplication(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (e:any) {
      setError(e.message);
    }
  }

  if (loading) return <p style={{padding:16}}>Loading…</p>;

  return (
    <div style={{padding: 16, maxWidth: 900, margin: '0 auto'}}>
      <h1>JATrack</h1>
      <button onClick={handleAdd}>Add sample</button>
      {error && <p style={{color:'crimson'}}>{error}</p>}

      <table style={{width:'100%', marginTop:16, borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Company</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Role</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Status</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(a => (
            <tr key={a.id}>
              <td style={{padding:'6px 0'}}>{a.company}</td>
              <td>{a.roleTitle}</td>
              <td>{a.status}</td>
              <td>
                <button onClick={() => handleDelete(a.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={4} style={{padding:8, color:'#666'}}>No applications yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
