import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { get } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar({ open, onClose, selectedCategory, onSelectCategory, showFavorites, onToggleFavorites }) {
  const [categories, setCategories] = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [expanded, setExpanded] = useState({});
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  useEffect(() => {
    get('/api/categories').then(setCategories).catch(() => {});
    get('/api/items').then(items => {
      const bycat = {};
      items.forEach(i => {
        if (!bycat[i.category]) bycat[i.category] = [];
        bycat[i.category].push(i);
      });
      setItemsByCategory(bycat);
    }).catch(() => {});
  }, []);

  const totalItems = Object.values(itemsByCategory).reduce((s, arr) => s + arr.length, 0);

  const toggleExpand = (name) => setExpanded(p => ({ ...p, [name]: !p[name] }));

  const borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)';

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} />}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 flex flex-col top-14 overflow-y-auto
        ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}
        border-r transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* ── Topics section ── */}
        <div className={`p-3 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest px-2 mb-2 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Topics</p>

          {/* All Items */}
          <button
            onClick={() => { onSelectCategory(''); onClose(); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 flex justify-between items-center ${
              !selectedCategory && !showFavorites
                ? 'bg-brand-bg text-brand'
                : isDark ? 'text-dark-muted hover:bg-dark-surface2' : 'text-light-muted hover:bg-light-surface2'
            }`}
          >
            <span>All Items</span>
            <span className={`text-xs tabular-nums ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>{totalItems}</span>
          </button>

          {/* Category rows with expandable card sub-list */}
          {categories.map(cat => {
            const catItems = itemsByCategory[cat.name] || [];
            const isSelected = selectedCategory === cat.name;
            const isOpen = expanded[cat.name];

            return (
              <div key={cat.id}>
                {/* Category header */}
                <div className={`flex items-center rounded-lg mb-0.5 transition-colors ${
                  isSelected
                    ? 'bg-brand-bg'
                    : isDark ? 'hover:bg-dark-surface2' : 'hover:bg-light-surface2'
                }`}>
                  <button
                    onClick={() => { onSelectCategory(cat.name); onClose(); }}
                    className={`flex-1 text-left px-3 py-2 text-sm font-medium flex items-center gap-2 min-w-0 ${
                      isSelected ? 'text-brand' : isDark ? 'text-dark-muted' : 'text-light-muted'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color_text }} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                  <div className="flex items-center gap-1 pr-2 shrink-0">
                    <span className={`text-xs tabular-nums ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>{catItems.length}</span>
                    {catItems.length > 0 && (
                      <button
                        onClick={() => toggleExpand(cat.name)}
                        className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                          isDark ? 'text-dark-hint hover:text-dark-muted hover:bg-dark-surface2' : 'text-light-hint hover:text-light-muted hover:bg-light-surface2'
                        }`}
                        aria-label={isOpen ? 'Collapse' : 'Expand'}
                      >
                        <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-items (card titles) */}
                {isOpen && catItems.length > 0 && (
                  <div className="ml-4 pl-2.5 mb-1" style={{ borderLeft: `1.5px solid ${borderColor}` }}>
                    {catItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { navigate(`/items/${item.id}`); onClose(); }}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors block truncate ${
                          isDark
                            ? 'text-dark-hint hover:text-dark-muted hover:bg-dark-surface2'
                            : 'text-light-hint hover:text-light-muted hover:bg-light-surface2'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Favorites ── */}
        <div className={`p-3 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
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

        {/* ── Bottom nav (mobile) ── */}
        <div className={`mt-auto p-3 border-t ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <div className="md:hidden flex flex-col gap-0.5 mb-2">
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
