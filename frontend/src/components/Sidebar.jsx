import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { get } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar({ open, onClose, selectedCategory, onSelectCategory, showFavorites, onToggleFavorites }) {
  const [categories, setCategories] = useState([]);
  const [itemCounts, setItemCounts] = useState({});
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    get('/api/categories').then(setCategories).catch(() => {});
    get('/api/items').then(items => {
      const counts = {};
      items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
      setItemCounts(counts);
    }).catch(() => {});
  }, []);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-60 flex flex-col
        ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}
        border-r transition-transform lg:translate-x-0 top-14 lg:top-0
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`p-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Categories</h3>
          <button
            onClick={() => { onSelectCategory(''); onClose(); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 flex justify-between items-center ${
              !selectedCategory && !showFavorites
                ? 'bg-brand-bg text-brand'
                : isDark ? 'text-dark-muted hover:bg-dark-surface2' : 'text-light-muted hover:bg-light-surface2'
            }`}
          >
            <span>All Items</span>
            <span className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>{Object.values(itemCounts).reduce((a, b) => a + b, 0)}</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { onSelectCategory(cat.name); onClose(); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 flex justify-between items-center ${
                selectedCategory === cat.name
                  ? 'bg-brand-bg text-brand'
                  : isDark ? 'text-dark-muted hover:bg-dark-surface2' : 'text-light-muted hover:bg-light-surface2'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: cat.color_text }} />
                {cat.name}
              </span>
              <span className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>{itemCounts[cat.name] || 0}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          <button
            onClick={() => { onToggleFavorites(); onClose(); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              showFavorites
                ? 'bg-brand-bg text-brand'
                : isDark ? 'text-dark-muted hover:bg-dark-surface2' : 'text-light-muted hover:bg-light-surface2'
            }`}
          >
            <span>{showFavorites ? '★' : '☆'}</span>
            Favorites Only
          </button>
        </div>

        <div className={`mt-auto p-4 border-t ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <div className="md:hidden flex flex-col gap-1 mb-3">
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
                onClick={onClose}
                className={({ isActive }) => `
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-brand-bg text-brand' : isDark ? 'text-dark-muted hover:bg-dark-surface2' : 'text-light-muted hover:bg-light-surface2'}
                `}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <NavLink
            to="/admin"
            onClick={onClose}
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-dark-hint hover:bg-dark-surface2 hover:text-dark-muted' : 'text-light-hint hover:bg-light-surface2 hover:text-light-muted'}`}
          >
            Admin Panel →
          </NavLink>
        </div>
      </aside>
    </>
  );
}
