import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { uploadFile } from '../api/client';

export default function ItemModal({ open, onClose, onSave, item, categories, statuses }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const mdInputRef = useRef();

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setCategory(item.category || '');
      setStatus(item.status || '');
      setNotes(item.notes || '');
      setImagePreview(item.image_url ? `/uploads/${item.image_url}` : '');
      setImageFile(null);
    } else {
      setTitle('');
      setCategory(categories?.[0]?.name || '');
      setStatus('');
      setNotes('');
      setImagePreview('');
      setImageFile(null);
    }
  }, [item, open, categories]);

  if (!open) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleMdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNotes(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (['md', 'markdown', 'txt'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (ev) => setNotes(ev.target.result);
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setUploading(true);
    try {
      const savedItem = await onSave({ title, category, status, notes, favorite: item?.favorite || false });
      if (imageFile && savedItem?.id) {
        const fd = new FormData();
        fd.append('image', imageFile);
        await uploadFile(`/api/items/${savedItem.id}/image`, fd);
      }
      onClose();
    } finally {
      setUploading(false);
    }
  };

  const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand-glow ${isDark ? 'bg-dark-surface2 border-dark-border2 text-dark-text' : 'bg-light-surface2 border-light-border2 text-light-text'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-6 ${isDark ? 'bg-dark-surface border-dark-border2' : 'bg-light-surface border-light-border2'}`}
        onClick={e => e.stopPropagation()}
      >
        <h2 className={`font-heading text-lg font-bold mb-5 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>
          {item ? 'Edit Item' : 'Add New Item'}
        </h2>

        {/* Image upload */}
        <div className="mb-4">
          <label className={labelClass}>Cover Image</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative aspect-video rounded-lg border-2 border-dashed cursor-pointer overflow-hidden transition-colors
              ${isDark ? 'border-dark-border2 hover:border-brand/50' : 'border-light-border2 hover:border-brand/50'}
            `}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <svg className={`w-8 h-8 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Click to upload image</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        </div>

        <div className="mb-4">
          <label className={labelClass}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Elden Ring, Monster Hunter" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={labelClass}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
              {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
              <option value="">No status</option>
              {statuses?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass + ' mb-0'}>Notes</label>
            <div className="flex gap-2">
              <button
                onClick={() => mdInputRef.current?.click()}
                className={`text-[11px] px-2 py-1 rounded border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}
              >
                Upload file
              </button>
              <input ref={mdInputRef} type="file" accept=".md,.markdown,.txt,.pdf" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Tips, goals, thoughts... supports Markdown"
            rows={5}
            className={`${inputClass} resize-y min-h-[100px]`}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'bg-dark-surface2 border-dark-border2 text-dark-text hover:bg-dark-surface3' : 'bg-light-surface2 border-light-border2 text-light-text hover:bg-light-surface3'}`}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={uploading} className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors disabled:opacity-50">
            {uploading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
