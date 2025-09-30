export type Application = {
  id?: number;
  company: string;
  roleTitle: string;
  status: 'APPLIED'|'HR_SCREEN'|'TECH_TEST'|'INTERVIEW'|'OFFER'|'REJECTED';
  appliedDate?: string;
  contactEmail?: string;
  jobUrl?: string;
  notes?: string;
};

export const STATUS_OPTIONS: Application['status'][] = [
  'APPLIED','HR_SCREEN','TECH_TEST','INTERVIEW','OFFER','REJECTED'
];

const BASE_URL = 'http://localhost:8080/api';

export async function listApplications(): Promise<Application[]> {
  const res = await fetch(`${BASE_URL}/applications`);
  if (!res.ok) throw new Error('Failed to list applications');
  return res.json();
}

export async function createApplication(a: Application): Promise<Application> {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(a),
  });
  if (!res.ok) throw new Error('Failed to create application');
  return res.json();
}

export async function updateApplication(id: number, a: Application): Promise<Application> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(a),
  });
  if (!res.ok) throw new Error('Failed to update application');
  return res.json();
}

export async function deleteApplication(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete application');
}
