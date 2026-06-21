import { useState, useEffect } from 'react';
import { get, post, del } from '../../api/client';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function AdminCrudPage({ title, icon, apiBase, fields, renderItem }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});

  const load = () => get(apiBase).then(setItems).catch(() => {});
  useEffect(() => { load(); }, [apiBase]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const mainField = fields[0];
    if (!form[mainField.name]?.trim()) return;
    await post(apiBase, form);
    toast.success('Added!');
    setForm({});
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await del(`${apiBase}/${id}`);
    toast.success('Deleted');
    load();
  };

  const inputClass = `px-3 py-2 rounded-lg border text-sm outline-none focus:border-brand ${isDark ? 'bg-dark-surface2 border-dark-border2 text-dark-text' : 'bg-light-surface2 border-light-border2 text-light-text'}`;

  return (
    <div>
      <h1 className={`font-heading text-2xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>
        <span>{icon}</span> {title}
      </h1>

      <form onSubmit={handleAdd} className={`rounded-xl border p-4 mb-6 flex flex-wrap gap-3 items-end ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
        {fields.map(f => (
          <div key={f.name} className="flex-1 min-w-[140px]">
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{f.label}</label>
            <input
              type={f.type || 'text'}
              value={form[f.name] || ''}
              onChange={e => setForm({ ...form, [f.name]: e.target.value })}
              placeholder={f.placeholder}
              className={inputClass + ' w-full'}
            />
          </div>
        ))}
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors">Add</button>
      </form>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
            <div className="flex items-center gap-3">
              {renderItem ? renderItem(item) : <span className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{item.name}</span>}
            </div>
            <button onClick={() => handleDelete(item.id)} className="text-xs px-3 py-1.5 rounded-md border border-danger/25 text-danger hover:bg-danger-bg transition-colors">Delete</button>
          </div>
        ))}
        {items.length === 0 && <p className={`text-sm text-center py-4 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>No items yet.</p>}
      </div>
    </div>
  );
}
