import { useState, useEffect } from 'react';
import { get, post } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function RequestPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [gameTitle, setGameTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => { get('/api/requests/recent').then(setRequests).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gameTitle.trim()) return;
    await post('/api/requests', { game_title: gameTitle, description, reason });
    toast.success('Request submitted!');
    setSubmitted(true);
    setGameTitle(''); setDescription(''); setReason('');
    get('/api/requests/recent').then(setRequests);
  };

  const inputClass = `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand-glow ${isDark ? 'bg-dark-surface2 border-dark-border2 text-dark-text' : 'bg-light-surface2 border-light-border2 text-light-text'}`;
  const statusColors = { pending: 'bg-brand-bg text-brand border-brand/30', approved: 'bg-success-bg text-success border-success/30', rejected: 'bg-danger-bg text-danger border-danger/30', done: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="w-10 h-0.5 bg-brand rounded-full mb-3" />
        <h1 className={`font-heading text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Request a Game Guide</h1>
        <p className={`text-sm ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Submit a request for a new game guide</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className={`rounded-xl border p-6 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
          <h2 className={`font-heading font-bold text-lg mb-4 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>How It Works</h2>
          <div className="space-y-4 mb-6">
            {['Submit your request with game details', 'Our team reviews and researches', 'Guide is published to the collection'].map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                <p className={`text-sm pt-1 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{step}</p>
              </div>
            ))}
          </div>

          {submitted && (
            <div className="rounded-lg bg-success-bg border border-success/30 p-3 mb-4 text-sm text-success font-medium">
              Request submitted successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Game Title *</label>
              <input value={gameTitle} onChange={e => setGameTitle(e.target.value)} placeholder="e.g. Elden Ring" className={inputClass} required />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What kind of guide are you looking for?" rows={3} className={`${inputClass} resize-y`} />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Reason</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why do you want this guide?" rows={2} className={`${inputClass} resize-y`} />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors">Submit Request</button>
          </form>
        </div>

        <div>
          <h2 className={`font-heading font-bold text-lg mb-4 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Recent Requests</h2>
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className={`rounded-lg border p-4 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-semibold text-sm ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{r.game_title}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[r.status] || statusColors.pending}`}>{r.status}</span>
                </div>
                {r.description && <p className={`text-xs mb-1 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{r.description}</p>}
                {r.admin_note && <p className="text-xs text-brand italic">Admin: {r.admin_note}</p>}
              </div>
            ))}
            {requests.length === 0 && <p className={`text-sm ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>No requests yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
