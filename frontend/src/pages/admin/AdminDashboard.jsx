import { useState, useEffect } from 'react';
import { get } from '../../api/client';
import { useTheme } from '../../contexts/ThemeContext';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState({ items: 0, categories: 0, requests: 0, users: 0 });
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    Promise.all([
      get('/api/items'),
      get('/api/categories'),
      get('/api/admin/requests'),
      get('/api/admin/superusers'),
    ]).then(([items, cats, reqs, users]) => {
      setStats({ items: items.length, categories: cats.length, requests: reqs.length, users: users.length });
      setRecentItems(items.slice(0, 8));
    }).catch(() => {});
  }, []);

  const cardClass = `rounded-xl border p-5 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`;

  return (
    <div>
      <h1 className={`font-heading text-2xl font-bold mb-6 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Items', value: stats.items, icon: '📦' },
          { label: 'Categories', value: stats.categories, icon: '🏷️' },
          { label: 'Requests', value: stats.requests, icon: '📨' },
          { label: 'Superusers', value: stats.users, icon: '👤' },
        ].map((s, i) => (
          <div key={i} className={cardClass}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-xs font-medium ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{s.label}</div>
            <div className={`text-3xl font-heading font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <h2 className={`font-heading text-lg font-bold mb-4 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Recent Items</h2>
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={isDark ? 'bg-dark-surface2' : 'bg-light-surface2'}>
              <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Title</th>
              <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Category</th>
              <th className={`text-left px-4 py-3 font-semibold ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentItems.map(item => (
              <tr key={item.id} className={`border-t ${isDark ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'}`}>
                <td className={`px-4 py-3 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{item.title}</td>
                <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-bg text-brand">{item.category}</span></td>
                <td className={`px-4 py-3 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>{item.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
