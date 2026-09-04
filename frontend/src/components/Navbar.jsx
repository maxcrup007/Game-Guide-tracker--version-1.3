import { NavLink } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ onToggleSidebar }) {
  const { theme } = useTheme();
  const { isAdmin, adminUsername } = useAuth();
  const isDark = theme === 'dark';

  return (
    <nav className={`
      sticky top-0 z-50 h-14 flex items-center px-4 gap-4 border-b backdrop-blur-xl
      ${isDark
        ? 'bg-dark-bg/85 border-dark-border'
        : 'bg-light-bg/85 border-light-border'
      }
    `}>
      <button
        onClick={onToggleSidebar}
        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-surface2 text-dark-text' : 'hover:bg-light-surface2 text-light-text'}`}
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <a href="/" className="font-heading font-bold text-lg tracking-tight flex items-center gap-2">
        <span className="text-brand">Game Guide</span>
        <span className={isDark ? 'text-dark-text' : 'text-light-text'}>Wikie!!!</span>
      </a>

      <div className="hidden md:flex items-center gap-1 ml-4">
        {[
          { to: '/', label: 'Collection' },
          { to: '/board', label: 'Board' },
          { to: '/request', label: 'Request' },
          { to: '/contact', label: 'Contact' },
        ].map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-brand-bg text-brand'
                : isDark ? 'text-dark-muted hover:bg-dark-surface2 hover:text-dark-text' : 'text-light-muted hover:bg-light-surface2 hover:text-light-text'
              }
            `}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isAdmin && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/15 border border-brand/30">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span className="text-xs font-semibold text-brand">{adminUsername}</span>
            <span className="text-[10px] text-brand/60 font-bold tracking-wide">ADMIN</span>
          </div>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
