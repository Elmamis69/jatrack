/* ===========================
   Config base y helpers
=========================== */
// src/api.ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
export { API_BASE };

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}


async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(await res.text());
  // para DELETE 204, no hay body; si necesitas manejarlo, hazlo fuera
  return res.json();
}

/* ===========================
   Auth (JWT)
=========================== */
export async function login(email: string, password: string) {
  const data = await http<{ token: string }>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("token", data.token);
  return data;
}

export async function register(name: string, email: string, password: string) {
  const data = await http<{ token: string }>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  localStorage.setItem("token", data.token);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
}

/* ===========================
   Tipos y constantes
=========================== */
export const STATUS_OPTIONS = [
  "APPLIED",
  "HR_SCREEN",
  "TECH_TEST",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type Application = {
  id?: number; // opcional para crear sin exigir id
  company: string;
  roleTitle: string;
  status: (typeof STATUS_OPTIONS)[number] | string;
  appliedDate?: string;
  contactEmail?: string;
  jobUrl?: string;
  notes?: string;
};

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

/* ===========================
   Applications CRUD
=========================== */
export async function listApplications(params?: {
  page?: number; size?: number; status?: string; q?: string; sort?: string;
}): Promise<Page<Application> | Application[]> {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set("page", String(params.page));
  if (params?.size !== undefined) q.set("size", String(params.size));
  if (params?.status) q.set("status", params.status);
  if (params?.q) q.set("q", params.q);
  if (params?.sort) q.set("sort", params.sort);

  const url = "/api/applications" + (q.toString() ? `?${q.toString()}` : "");
  const res = await fetch(`${API_BASE}${url}`, { headers: { ...authHeaders() } });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createApplication(payload: Partial<Application>) {
  return http<Application>("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function updateApplication(id: number, payload: Partial<Application>) {
  return http<Application>(`/api/applications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function deleteApplication(id: number) {
  const res = await fetch(`${API_BASE}/api/applications/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
}

/* ===========================
   Search + Pagination
=========================== */
export async function searchApplications(
  params: {
    status?: Application["status"];
    q?: string; // si tu backend usa 'q' como query param
    page?: number;
    size?: number;
    sort?: string;
  } = {}
): Promise<Page<Application>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", String(params.status));
  if (params.q) qs.set("q", params.q);
  qs.set("page", String(params.page ?? 0));
  qs.set("size", String(params.size ?? 10));
  qs.set("sort", params.sort ?? "appliedDate,desc");

  const res = await fetch(`${API_BASE}/api/applications?${qs.toString()}`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();

  // Compatibilidad por si tu backend a veces devuelve array plano
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
  return data as Page<Application>;
}
// Listar "todo" para Kanban (soporta Page y array plano)
export async function listAllApplications(): Promise<Application[]> {
  const q = new URLSearchParams({ page: "0", size: "1000", sort: "appliedDate,desc" });
  const res = await fetch(`${API_BASE}/api/applications?${q.toString()}`, {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data) ? data : (data.content ?? []);
}

