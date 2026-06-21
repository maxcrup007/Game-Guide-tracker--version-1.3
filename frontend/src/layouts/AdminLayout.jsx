import { useState } from 'react';
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { to: '/admin/tags', label: 'Tags', icon: '🔖' },
  { to: '/admin/platforms', label: 'Platforms', icon: '🖥️' },
  { to: '/admin/statuses', label: 'Statuses', icon: '📋' },
  { to: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { to: '/admin/requests', label: 'Requests', icon: '📨' },
  { to: '/admin/superusers', label: 'Superusers', icon: '👤' },
];

export default function AdminLayout() {
  const { isAdmin, loading, logout, adminUsername } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);
  const isDark = theme === 'dark';

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-dark-muted">Loading...</div></div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex">
      {sideOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSideOpen(false)} />
      )}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-60 flex flex-col
        ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}
        border-r transition-transform lg:translate-x-0
        ${sideOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className={`h-14 flex items-center px-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <span className="font-heading font-bold text-brand text-lg">Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {adminLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              onClick={() => setSideOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-brand-bg text-brand'
                  : isDark ? 'text-dark-muted hover:bg-dark-surface2 hover:text-dark-text' : 'text-light-muted hover:bg-light-surface2 hover:text-light-text'
                }
              `}
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className={`p-4 border-t ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <div className={`text-xs mb-2 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Signed in as <strong className={isDark ? 'text-dark-text' : 'text-light-text'}>{adminUsername}</strong></div>
          <button onClick={handleLogout} className="w-full py-2 text-sm font-medium rounded-lg bg-danger-bg text-danger border border-danger/25 hover:bg-danger/20 transition-colors">
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-14 flex items-center px-4 border-b ${isDark ? 'bg-dark-bg border-dark-border' : 'bg-light-bg border-light-border'} lg:hidden`}>
          <button onClick={() => setSideOpen(true)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-dark-surface2' : 'hover:bg-light-surface2'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="ml-3 font-heading font-bold text-brand">Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
