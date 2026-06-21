import { useState, useEffect } from 'react';
import { get, put, del } from '../../api/client';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function AdminRequests() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('');

  const load = () => {
    const url = filter ? `/api/admin/requests?status=${filter}` : '/api/admin/requests';
    get(url).then(setRequests).catch(() => {});
  };
  useEffect(() => { load(); }, [filter]);

  const updateRequest = async (id, data) => {
    await put(`/api/admin/requests/${id}`, data);
    toast.success('Updated');
    load();
  };

  const deleteRequest = async (id) => {
    if (!confirm('Delete?')) return;
    await del(`/api/admin/requests/${id}`);
    toast.success('Deleted');
    load();
  };

  const statusColors = { pending: 'bg-brand-bg text-brand', approved: 'bg-success-bg text-success', rejected: 'bg-danger-bg text-danger', done: 'bg-blue-500/10 text-blue-400' };
  const inputClass = `px-3 py-2 rounded-lg border text-sm outline-none focus:border-brand ${isDark ? 'bg-dark-surface2 border-dark-border2 text-dark-text' : 'bg-light-surface2 border-light-border2 text-light-text'}`;

  return (
    <div>
      <h1 className={`font-heading text-2xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>📨 Requests</h1>

      <div className="flex gap-2 mb-6">
        {['', 'pending', 'approved', 'done', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-brand text-white' : isDark ? 'bg-dark-surface2 text-dark-muted hover:text-dark-text' : 'bg-light-surface2 text-light-muted hover:text-light-text'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {requests.map(r => (
          <div key={r.id} className={`rounded-lg border p-4 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className={`font-semibold text-sm ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{r.game_title}</h3>
                {r.description && <p className={`text-xs mt-1 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{r.description}</p>}
                {r.reason && <p className={`text-xs mt-0.5 italic ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Reason: {r.reason}</p>}
              </div>
              <button onClick={() => deleteRequest(r.id)} className="text-xs text-danger hover:text-danger/80">Delete</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 items-center">
              <select
                value={r.status}
                onChange={e => updateRequest(r.id, { status: e.target.value })}
                className={`${inputClass} w-auto`}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="done">Done</option>
                <option value="rejected">Rejected</option>
              </select>
              <input
                placeholder="Admin note..."
                defaultValue={r.admin_note || ''}
                onBlur={e => { if (e.target.value !== (r.admin_note || '')) updateRequest(r.id, { admin_note: e.target.value }); }}
                className={`${inputClass} flex-1 min-w-[150px]`}
              />
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColors[r.status] || statusColors.pending}`}>{r.status}</span>
            </div>
          </div>
        ))}
        {requests.length === 0 && <p className={`text-center py-8 text-sm ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>No requests.</p>}
      </div>
    </div>
  );
}
