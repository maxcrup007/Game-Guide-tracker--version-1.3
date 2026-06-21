import { useState, useEffect } from 'react';
import { get, post, del } from '../../api/client';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminSuperusers() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { adminUsername } = useAuth();
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const load = () => get('/api/admin/superusers').then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    const res = await post('/api/admin/superusers', { username, password });
    if (res.error) { toast.error(res.error); return; }
    toast.success('User created!');
    setUsername(''); setPassword('');
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    const res = await del(`/api/admin/superusers/${id}`);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Deleted');
    load();
  };

  const inputClass = `px-3 py-2 rounded-lg border text-sm outline-none focus:border-brand ${isDark ? 'bg-dark-surface2 border-dark-border2 text-dark-text' : 'bg-light-surface2 border-light-border2 text-light-text'}`;

  return (
    <div>
      <h1 className={`font-heading text-2xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>👤 Superusers</h1>

      <form onSubmit={handleAdd} className={`rounded-xl border p-4 mb-6 flex flex-wrap gap-3 items-end ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
        <div className="flex-1 min-w-[140px]">
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className={`${inputClass} w-full`} required />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={`${inputClass} w-full`} required />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors">Add</button>
      </form>

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-bg text-brand flex items-center justify-center text-sm font-bold">{u.username[0].toUpperCase()}</div>
              <div>
                <span className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{u.username}</span>
                {u.username === adminUsername && <span className="ml-2 text-[10px] text-brand font-medium">(you)</span>}
              </div>
            </div>
            <button onClick={() => handleDelete(u.id)} className="text-xs px-3 py-1.5 rounded-md border border-danger/25 text-danger hover:bg-danger-bg transition-colors">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
