/**
 * CURO API Client
 * Thin wrapper around fetch — injects JWT Bearer token, handles 401 refresh.
 * All functions return typed results with { data, error } shape.
 */

export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

// ── Token storage ────────────────────────────────────────────────────────────
const STORAGE_KEY_ACCESS  = 'curo.accessToken';
const STORAGE_KEY_REFRESH = 'curo.refreshToken';
const STORAGE_KEY_USER    = 'curo.user';

export function getAccessToken()  { return localStorage.getItem(STORAGE_KEY_ACCESS); }
export function getRefreshToken() { return localStorage.getItem(STORAGE_KEY_REFRESH); }
export function getStoredUser()   {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || 'null'); } catch { return null; }
}

export function storeTokens(accessToken: string, refreshToken: string, user: unknown) {
  localStorage.setItem(STORAGE_KEY_ACCESS, accessToken);
  localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY_ACCESS);
  localStorage.removeItem(STORAGE_KEY_REFRESH);
  localStorage.removeItem(STORAGE_KEY_USER);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    return { data: null, error: 'Cannot reach server. Is the backend running?', status: 0 };
  }

  // Auto-refresh on 401
  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, false);
    clearTokens();
    window.location.href = '/';
    return { data: null, error: 'Session expired', status: 401 };
  }

  let json: any;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok) {
    return { data: null, error: json.message || `HTTP ${res.status}`, status: res.status };
  }
  return { data: json as T, error: null, status: res.status };
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (json.success && json.accessToken) {
      localStorage.setItem('curo.accessToken', json.accessToken);
      return true;
    }
  } catch { /* swallow */ }
  return false;
}

export const api = {
  get:    <T>(path: string)                        => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown)         => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)         => request<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)         => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)                        => request<T>(path, { method: 'DELETE' }),
};

// ── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (mobile: string, role: 'DOCTOR' | 'PATIENT') =>
    api.post<{ success: boolean; message: string; maskedMobile?: string }>(
      '/auth/otp/send', { mobile, role }
    ),

  verifyOtp: (mobile: string, otp: string, role: 'DOCTOR' | 'PATIENT') =>
    api.post<{
      success: boolean;
      message: string;
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      isNewUser: boolean;
      user: {
        id: string; name: string; role: string; mobile: string;
        email?: string; slug?: string; doctorId?: string; patientId?: string;
        needsOnboarding?: boolean;
      };
    }>('/auth/otp/verify', { mobile, otp, role }),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  me: () => api.get<{ user: { userId: string; role: string; mobile: string } }>('/auth/me'),
};

// ── Doctor API ────────────────────────────────────────────────────────────────
export const doctorApi = {
  // Profile
  getProfile:   () => api.get<{ success: boolean; data: Record<string, unknown> }>('/doctors/profile'),
  updateProfile: (body: unknown) => api.put<{ success: boolean; message: string }>('/doctors/profile', body),

  // Dashboard
  getDashboard: () => api.get<{ success: boolean; data: Record<string, unknown> }>('/doctors/dashboard'),

  // Schedule
  getSchedule:  () => api.get<{ success: boolean; data: Record<string, unknown> }>('/doctors/schedule'),
  blockDates:   (body: { dates: string[]; reason?: string }) => api.post('/doctors/blocked-dates', body),
  unblockDates: (body: { dates: string[] }) => api.delete<{ success: boolean }>('/doctors/blocked-dates'),
  updateUpi:    (body: { upiId?: string; upiQrUrl?: string }) => api.put<{ success: boolean; message: string }>('/doctors/upi', body),

  // Onboarding wizard
  saveProfile: (body: unknown) =>
    api.post<{ success: boolean; message: string; doctor?: Record<string, unknown>; bookingUrl?: string }>(
      '/doctors/onboarding/profile', body
    ),
  saveFees: (body: unknown) =>
    api.post<{ success: boolean; message: string }>('/doctors/onboarding/fees', body),
  saveSchedule: (body: unknown) =>
    api.post<{ success: boolean; message: string }>('/doctors/onboarding/schedule', body),
  completeOnboarding: (body: { upiId?: string; upiQrUrl?: string }) =>
    api.post<{ success: boolean; message: string }>('/doctors/onboarding/complete', body),
};

// ── Patient API ───────────────────────────────────────────────────────────────
export const patientApi = {
  getMe:              () => api.get<{ success: boolean; data: Record<string, unknown> }>('/patients/me'),
  getMyRecords:       () => api.get<{ success: boolean; data: Record<string, unknown> }>('/patients/me/records'),
  getThread:          (patientId: string) => api.get<{ success: boolean; data: Record<string, unknown> }>(`/patients/${patientId}/records`),
  updateProfile:      (body: unknown) => api.put<{ success: boolean; message: string }>('/patients/me', body),
  completeOnboarding: (body: { fullName: string; gender: string; dateOfBirth: string }) =>
    api.post<{ success: boolean; message: string; profile?: Record<string, unknown> }>('/patients/me/onboarding', body),
};

// ── Bookings API ──────────────────────────────────────────────────────────────
export const bookingsApi = {
  create: (body: unknown) => api.post<{ success: boolean; appointment: Record<string, unknown>; message?: string }>('/bookings', body),
  confirmPayment: (id: string, body: { utrNumber?: string }) => api.post<{ success: boolean; message: string }>(`/bookings/${id}/confirm`, body),
  getMy: () => api.get<{ success: boolean; data: Record<string, unknown>[] }>('/bookings/my'),
  getById: (id: string) => api.get<{ success: boolean; data: Record<string, unknown> }>(`/bookings/${id}`),
  cancel: (id: string) => api.put<{ success: boolean; message: string }>(`/bookings/${id}/cancel`, {}),
  reschedule: (id: string, body: { slotDate: string; slotTime: string }) => api.put<{ success: boolean; message: string }>(`/bookings/${id}/reschedule`, body),
};

// ── Consultations API ─────────────────────────────────────────────────────────
export const consultationsApi = {
  getToday: () => api.get<{ success: boolean; data: { today: string; upcoming: any[]; live: any[]; completed: any[] } }>('/consultations/today'),
  getPast: (limit?: number) => api.get<{ success: boolean; data: any[] }>(`/consultations/past${limit ? `?limit=${limit}` : ''}`),
  getById: (id: string) => api.get<{ success: boolean; data: Record<string, unknown> }>(`/consultations/${id}`),
  start: (id: string, body?: { meetLink?: string }) => api.post<{ success: boolean; message: string }>(`/consultations/${id}/start`, body || {}),
  complete: (id: string) => api.post<{ success: boolean; message: string; code?: string }>(`/consultations/${id}/complete`, {}),
};

// ── Prescriptions API ─────────────────────────────────────────────────────────
export const prescriptionsApi = {
  create: (body: unknown) => api.post<{ success: boolean; message: string; prescriptionId: string }>('/prescriptions', body),
  getById: (id: string) => api.get<{ success: boolean; data: Record<string, unknown> }>(`/prescriptions/${id}`),
  getByAppointmentId: (id: string) => api.get<{ success: boolean; data: Record<string, unknown> }>(`/prescriptions/appointment/${id}`),
  // Note: PDF download is handled via standard <a> link since it returns a file blob
};
