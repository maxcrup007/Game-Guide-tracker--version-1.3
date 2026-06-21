import { useState, useEffect } from 'react';
import { get, post, put, del } from '../../api/client';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const load = () => get('/api/admin/announcements').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await post('/api/admin/announcements', { title, body, active: true });
    toast.success('Announcement posted!');
    setTitle(''); setBody('');
    load();
  };

  const toggleActive = async (item) => {
    await put(`/api/admin/announcements/${item.id}`, { active: !item.active });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await del(`/api/admin/announcements/${id}`);
    toast.success('Deleted');
    load();
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-brand ${isDark ? 'bg-dark-surface2 border-dark-border2 text-dark-text' : 'bg-light-surface2 border-light-border2 text-light-text'}`;

  return (
    <div>
      <h1 className={`font-heading text-2xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>📢 Announcements</h1>

      <form onSubmit={handleAdd} className={`rounded-xl border p-4 mb-6 space-y-3 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className={inputClass} required />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Body (optional)" rows={2} className={`${inputClass} resize-y`} />
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors">Post</button>
      </form>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={`flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
            <div>
              <div className={`text-sm font-semibold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{item.title}</div>
              {item.body && <div className={`text-xs mt-0.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{item.body}</div>}
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={() => toggleActive(item)} className={`text-xs px-2 py-1 rounded border ${item.active ? 'bg-success-bg text-success border-success/30' : 'bg-danger-bg text-danger border-danger/30'}`}>
                {item.active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-xs px-2 py-1 rounded border border-danger/25 text-danger hover:bg-danger-bg">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
