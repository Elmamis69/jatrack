export type Application = {
  id?: number;
  company: string;
  roleTitle: string;
  status: 'APPLIED' | 'HR_SCREEN' | 'TECH_TEST' | 'INTERVIEW' | 'OFFER' | 'REJECTED';
  appliedDate?: string;
  contactEmail?: string;
  jobUrl?: string;
  notes?: string;
};

export const STATUS_OPTIONS: Application['status'][] = [
  'APPLIED', 'HR_SCREEN', 'TECH_TEST', 'INTERVIEW', 'OFFER', 'REJECTED'
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(a),
  });
  if (!res.ok) throw new Error('Failed to create application');
  return res.json();
}

export async function updateApplication(id: number, a: Application): Promise<Application> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(a),
  });
  if (!res.ok) throw new Error('Failed to update application');
  return res.json();
}

export async function deleteApplication(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete application');
}

/* ---------------- NUEVO: Search + Pagination ---------------- */
export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export async function searchApplications(
  params: { status?: Application['status']; q?: string; page?: number; size?: number; sort?: string } = {}
): Promise<PageResponse<Application>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.q) qs.set('q', params.q);
  qs.set('page', String(params.page ?? 0));
  qs.set('size', String(params.size ?? 10));
  qs.set('sort', params.sort ?? 'appliedDate,desc');

  const res = await fetch(`${BASE_URL}/applications?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to search applications');

  const data = await res.json();

  // 👇 Compatibilidad: si el backend devuelve un array simple
  if (Array.isArray(data)) {
    return {
      content: data,
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: 1,
      first: true,
      last: true,
    };
  }

  // Si ya es PageResponse, lo devolvemos tal cual
  return data;
}

