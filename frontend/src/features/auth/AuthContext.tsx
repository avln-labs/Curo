import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, storeTokens, clearTokens, getStoredUser, getAccessToken } from '../../shared/api';
import { useNavigate } from 'react-router-dom';

export type AuthRole = 'DOCTOR' | 'PATIENT' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  role: AuthRole;
  mobile: string;
  email?: string;
  slug?: string;
  doctorId?: string;
  patientId?: string;
  needsOnboarding?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  sendOtp: (mobile: string, role: 'DOCTOR' | 'PATIENT') => Promise<{ success: boolean; message: string }>;
  verifyOtp: (mobile: string, otp: string, role: 'DOCTOR' | 'PATIENT') => Promise<{ success: boolean; message: string; isNewUser?: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// In-memory OTP store for offline demo mode
const demoOtpStore = new Map<string, boolean>();

async function isBackendOnline(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:4000/api/v1/health', { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (token && stored) setUser(stored as AuthUser);
    setIsLoading(false);
  }, []);

  const sendOtp = useCallback(async (mobile: string, role: 'DOCTOR' | 'PATIENT') => {
    const online = await isBackendOnline();

    if (!online) {
      // ── Demo / offline mode ──
      demoOtpStore.set(mobile, true);
      return {
        success: true,
        message: `Demo mode · OTP sent to ${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}. Use 123456 to continue.`,
      };
    }

    // ── Real backend ──
    const { data, error } = await authApi.sendOtp(mobile, role);
    if (error || !data?.success) return { success: false, message: error || data?.message || 'Failed to send OTP' };
    return { success: true, message: data.message };
  }, []);

  const verifyOtp = useCallback(async (mobile: string, otp: string, role: 'DOCTOR' | 'PATIENT') => {
    const online = await isBackendOnline();

    if (!online) {
      // ── Demo / offline mode ──
      if (otp !== '123456') return { success: false, message: 'Incorrect OTP. Demo mode: use 123456' };
      if (!demoOtpStore.has(mobile)) return { success: false, message: 'Please request OTP first' };
      demoOtpStore.delete(mobile);

      // Create a generic demo session (no hardcoded accounts)
      const demoUser: AuthUser = {
        id: `demo_${Date.now()}`,
        name: role === 'DOCTOR' ? 'Demo Doctor' : 'Demo Patient',
        role,
        mobile,
        needsOnboarding: role === 'DOCTOR',
      };

      // Store as a fake JWT session
      localStorage.setItem('curo.accessToken', `demo-token-${Date.now()}`);
      localStorage.setItem('curo.refreshToken', `demo-refresh-${Date.now()}`);
      localStorage.setItem('curo.user', JSON.stringify(demoUser));
      setUser(demoUser);

      return { success: true, message: 'Demo session created. Connect backend for full functionality.', isNewUser: true };
    }


    // ── Real backend ──
    const { data, error } = await authApi.verifyOtp(mobile, otp, role);
    if (error || !data?.success) return { success: false, message: error || data?.message || 'Invalid OTP' };

    // Map the backend response to the AuthUser shape
    // Backend sends: { id, mobile, email, role, fullName, doctorId, slug, needsOnboarding, patientId, ... }
    const backendUser = data.user as Record<string, unknown>;
    const mappedUser: AuthUser = {
      id: backendUser.id as string,
      name: (backendUser.fullName as string) || (backendUser.name as string) || '',
      role: backendUser.role as AuthRole,
      mobile: backendUser.mobile as string,
      email: backendUser.email as string | undefined,
      slug: backendUser.slug as string | undefined,
      doctorId: backendUser.doctorId as string | undefined,
      patientId: backendUser.patientId as string | undefined,
      needsOnboarding: backendUser.needsOnboarding as boolean | undefined,
    };
    storeTokens(data.accessToken, data.refreshToken, mappedUser);
    setUser(mappedUser);
    return { success: true, message: data.message, isNewUser: data.isNewUser };


  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('curo.refreshToken');
    if (refreshToken && !refreshToken.startsWith('demo-')) {
      await authApi.logout(refreshToken).catch(() => {});
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}

/** Route guard — redirects to / if not authenticated */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading…</span>
    </div>
  );

  return isAuthenticated ? <>{children}</> : null;
}
