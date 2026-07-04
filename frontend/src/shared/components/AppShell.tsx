import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const THEME_KEY = 'curo.theme';

function getInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const DOCTOR_NAV = [
  { label: 'Dashboard',      to: '/dashboard',         icon: '⊞' },
  { label: 'Consultations',  to: '/consultations',     icon: '♥' },
  { label: 'Prescriptions',  to: '/prescriptions',     icon: '✦' },
  { label: 'Profile',        to: '/doctor-profile',    icon: '👤' },
];

const PATIENT_NAV = [
  { label: 'My Records',          to: '/records',          icon: '◈' },
  { label: 'My Profile',          to: '/patient-profile',  icon: '👤' },
  { label: 'Prescriptions',       to: '/prescriptions',    icon: '✦' },
  { label: 'Book Consultation',   to: '/booking/details',  icon: '📅' },
];


// Admin Console: internal only — never shown to doctors or patients
const ADMIN_NAV = [
  { label: 'Admin Console',  to: '/admin',             icon: '🛡' },
];

function NavSection({ items, pathname }: { items: typeof DOCTOR_NAV; pathname: string }) {
  return (
    <nav className="sidebar-nav">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`sidebar-link${pathname === item.to ? ' active' : ''}`}
        >
          <span className="link-icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const navItems = user?.role === 'DOCTOR' ? DOCTOR_NAV : PATIENT_NAV;
  // Admin Console only visible to ADMIN role — never to doctors or patients
  const showAdmin = user?.role === 'ADMIN';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">C</div>
          <span className="sidebar-brand-name">CURO</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">
            {user?.role === 'DOCTOR' ? 'Workspace' : 'Patient Portal'}
          </div>
          <NavSection items={navItems} pathname={pathname} />
        </div>

        {showAdmin && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Platform</div>
            <NavSection items={ADMIN_NAV} pathname={pathname} />
          </div>
        )}

        <div className="sidebar-footer">
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-role">{user?.role === 'DOCTOR' ? 'Physician' : user?.role === 'ADMIN' ? 'Admin' : 'Patient'}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.875rem', padding: 4, borderRadius: 4 }}
            >
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            {user?.role === 'DOCTOR' ? 'CURO — Clinical Workspace' : 'CURO — Patient Portal'}
          </div>
          <div className="topbar-actions">
            {user?.role === 'DOCTOR' && (
              <Link to="/booking/details" className="btn btn-primary btn-sm">
                + New Booking
              </Link>
            )}
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
