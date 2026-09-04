import { useState, useEffect } from 'react';
import { get, put, del } from '../../api/client';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/15 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function AdminEditRequests() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const load = () => {
    const q = filter ? `?status=${filter}` : '';
    get(`/api/admin/edit-requests${q}`).then(setRequests).catch(() => {});
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await put(`/api/admin/edit-requests/${id}`, { status, admin_note: adminNote });
    toast.success(`Request ${status}`);
    setExpanded(null);
    setAdminNote('');
    load();
  };

  const deleteReq = async (id) => {
    if (!confirm('Delete this request?')) return;
    await del(`/api/admin/edit-requests/${id}`);
    toast.success('Deleted');
    load();
  };

  const cardBase = `rounded-xl border p-4 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`;
  const labelCls = `block text-xs font-semibold mb-1 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`;
  const valueCls = `text-sm ${isDark ? 'text-dark-text' : 'text-light-text'}`;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className={`font-heading text-xl font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Edit Requests</h1>
          <p className={`text-sm ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>User requests to modify item content</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className={`px-3 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-dark-surface border-dark-border2 text-dark-text' : 'bg-white border-light-border2 text-light-text'}`}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {requests.length === 0 ? (
        <div className={`text-center py-16 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>No edit requests found.</div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className={cardBase}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
                      {r.status?.toUpperCase()}
                    </span>
                    <span className={`text-xs font-semibold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>
                      Item: {r.item_title || `#${r.item_id}`}
                    </span>
                    {r.requester_name && (
                      <span className={`text-xs ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>by {r.requester_name}</span>
                    )}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => { setExpanded(expanded === r.id ? null : r.id); setAdminNote(r.admin_note || ''); }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}
                  >
                    {expanded === r.id ? 'Close' : 'Review'}
                  </button>
                  <button
                    onClick={() => deleteReq(r.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-danger/25 text-danger hover:bg-danger-bg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === r.id && (
                <div className={`mt-4 pt-4 border-t space-y-3 ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className={labelCls}>Reason</p>
                      <p className={valueCls}>{r.reason || <em className="opacity-40">—</em>}</p>
                    </div>
                    <div>
                      <p className={labelCls}>Proposed Changes</p>
                      <p className={valueCls}>{r.proposed_changes || <em className="opacity-40">—</em>}</p>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Admin Note</label>
                    <textarea
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      placeholder="Optional note to attach..."
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none ${isDark ? 'bg-dark-bg border-dark-border2 text-dark-text placeholder:text-dark-hint focus:border-brand' : 'bg-white border-light-border2 text-light-text placeholder:text-light-hint focus:border-brand'}`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(r.id, 'approved')}
                      className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, 'rejected')}
                      className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
