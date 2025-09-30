import { useState, useEffect } from 'react';
import type { Application } from '../api';
import { STATUS_OPTIONS } from '../api';

type Props = {
  initial?: Partial<Application>;
  onSubmit: (data: Application) => Promise<void> | void;
  onCancel?: () => void;
};

export default function ApplicationForm({ initial = {}, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<Application>({
    company: '',
    roleTitle: '',
    status: 'APPLIED',
    contactEmail: '',
    jobUrl: '',
    notes: '',
    ...initial,
  });

  useEffect(() => { setForm(prev => ({ ...prev, ...initial })); }, [initial]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company?.trim() || !form.roleTitle?.trim()) {
      alert('Company y Role son obligatorios');
      return;
    }
    await onSubmit(form);
  }

  const input = { padding: '8px', width: '100%', background: '#1f1f1f', color: 'white', border: '1px solid #333', borderRadius: 6 } as const;
  const label = { display:'block', fontWeight:600, marginTop:10 } as const;

  return (
    <form onSubmit={handleSubmit} style={{display:'grid', gap:10}}>
      <label style={label}>Company</label>
      <input name="company" value={form.company} onChange={handleChange} style={input} required />

      <label style={label}>Role</label>
      <input name="roleTitle" value={form.roleTitle} onChange={handleChange} style={input} required />

      <label style={label}>Status</label>
      <select name="status" value={form.status} onChange={handleChange} style={{...input, padding:'8px 6px'}}>
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <label style={label}>Contact email</label>
      <input name="contactEmail" value={form.contactEmail ?? ''} onChange={handleChange} style={input} />

      <label style={label}>Job URL</label>
      <input name="jobUrl" value={form.jobUrl ?? ''} onChange={handleChange} style={input} />

      <label style={label}>Notes</label>
      <textarea name="notes" value={form.notes ?? ''} onChange={handleChange} style={{...input, minHeight:80}} />

      <div style={{display:'flex', gap:10, marginTop:10}}>
        <button type="submit">Save</button>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
