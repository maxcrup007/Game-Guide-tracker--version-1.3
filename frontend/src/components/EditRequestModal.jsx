import { useState, useEffect } from 'react';
import { post } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function EditRequestModal({ open, onClose, item }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [requesterName, setRequesterName] = useState('');
  const [reason, setReason] = useState('');
  const [proposed, setProposed] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setRequesterName(''); setReason(''); setProposed(''); }
  }, [open]);

  if (!open || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Please describe the reason for editing.'); return; }
    setLoading(true);
    try {
      await post('/api/edit-requests', {
        item_id: item.id,
        requester_name: requesterName.trim(),
        reason: reason.trim(),
        proposed_changes: proposed.trim(),
      });
      toast.success('Edit request submitted! Admin will review it.');
      onClose();
    } catch {
      toast.error('Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-md rounded-2xl border shadow-2xl ${
        isDark ? 'bg-dark-surface border-dark-border2' : 'bg-white border-light-border2'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <div>
            <h2 className={`font-heading font-bold text-base ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Request Edit</h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
              "{item.title}"
            </p>
          </div>
          <button onClick={onClose} className={`w-7 h-7 flex items-center justify-center rounded-lg text-lg ${isDark ? 'hover:bg-dark-surface2 text-dark-muted' : 'hover:bg-light-surface2 text-light-muted'}`}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className={`text-xs rounded-lg px-3 py-2.5 flex gap-2 ${isDark ? 'bg-dark-surface2 text-dark-muted' : 'bg-light-surface2 text-light-muted'}`}>
            <span>ℹ️</span>
            <span>Only admins can edit items. Submit a request and the admin will review and apply changes.</span>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Your Name <span className={isDark ? 'text-dark-hint' : 'text-light-hint'}>(optional)</span></label>
            <input
              type="text"
              value={requesterName}
              onChange={e => setRequesterName(e.target.value)}
              placeholder="e.g. Player123"
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
                isDark
                  ? 'bg-dark-bg border-dark-border2 text-dark-text placeholder:text-dark-hint focus:border-brand'
                  : 'bg-white border-light-border2 text-light-text placeholder:text-light-hint focus:border-brand'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Reason for Edit <span className="text-danger">*</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Why does this item need to be updated?"
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors resize-none ${
                isDark
                  ? 'bg-dark-bg border-dark-border2 text-dark-text placeholder:text-dark-hint focus:border-brand'
                  : 'bg-white border-light-border2 text-light-text placeholder:text-light-hint focus:border-brand'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Proposed Changes <span className={isDark ? 'text-dark-hint' : 'text-light-hint'}>(optional)</span></label>
            <textarea
              value={proposed}
              onChange={e => setProposed(e.target.value)}
              placeholder="Describe what you'd like changed or corrected..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors resize-none ${
                isDark
                  ? 'bg-dark-bg border-dark-border2 text-dark-text placeholder:text-dark-hint focus:border-brand'
                  : 'bg-white border-light-border2 text-light-text placeholder:text-light-hint focus:border-brand'
              }`}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
