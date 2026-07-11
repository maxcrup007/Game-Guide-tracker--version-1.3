import { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { uploadFile } from '../api/client';

export default function ImageInsertDialog({ onInsert, onClose }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState('url');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [previewOk, setPreviewOk] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef();

  const handleUrlInsert = () => {
    const src = url.trim();
    if (!src) return;
    onInsert(`![${alt || 'image'}](${src})`);
  };

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await uploadFile('/api/upload-image', fd);
      if (res.url) {
        setUploadedUrl(res.url);
        setTab('uploaded');
      }
    } finally {
      setUploading(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand-glow ${isDark ? 'bg-dark-bg border-dark-border2 text-dark-text placeholder:text-dark-hint' : 'bg-white border-light-border2 text-light-text placeholder:text-light-hint'}`;
  const tabBtn = (active) => `px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${active ? 'border-brand text-brand' : `border-transparent ${isDark ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'}`}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-xl border shadow-2xl ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-light-border'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <h3 className={`font-heading font-bold text-base ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Insert Image</h3>
          <button onClick={onClose} className={`w-7 h-7 flex items-center justify-center rounded-lg ${isDark ? 'text-dark-muted hover:bg-dark-surface2' : 'text-light-muted hover:bg-light-surface2'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <button className={tabBtn(tab === 'url')} onClick={() => setTab('url')}>From URL</button>
          <button className={tabBtn(tab === 'upload')} onClick={() => setTab('upload')}>Upload File</button>
          {uploadedUrl && <button className={tabBtn(tab === 'uploaded')} onClick={() => setTab('uploaded')}>Uploaded ✓</button>}
        </div>

        <div className="p-5 space-y-4">
          {/* URL tab */}
          {tab === 'url' && (
            <>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Image URL</label>
                <input
                  value={url}
                  onChange={e => { setUrl(e.target.value); setPreviewOk(false); }}
                  placeholder="https://example.com/image.png"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Alt text (optional)</label>
                <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Image description" className={inputClass} />
              </div>
              {url && (
                <div>
                  <p className={`text-xs mb-2 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Preview</p>
                  <div className={`rounded-lg border overflow-hidden flex items-center justify-center min-h-[100px] ${isDark ? 'bg-dark-bg border-dark-border2' : 'bg-light-surface2 border-light-border2'}`}>
                    <img
                      src={url}
                      alt={alt || 'preview'}
                      className="max-w-full max-h-48 object-contain rounded"
                      onLoad={() => setPreviewOk(true)}
                      onError={() => setPreviewOk(false)}
                    />
                    {!previewOk && (
                      <p className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Loading preview...</p>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={handleUrlInsert}
                disabled={!url.trim()}
                className="w-full py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors disabled:opacity-40"
              >
                Insert Image
              </button>
            </>
          )}

          {/* Upload tab */}
          {tab === 'upload' && (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                className={`rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-10 ${
                  isDragging
                    ? 'border-brand bg-brand-bg'
                    : isDark ? 'border-dark-border2 hover:border-brand/50 bg-dark-bg' : 'border-light-border2 hover:border-brand/50 bg-light-surface2'
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    <p className={`text-sm ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Uploading...</p>
                  </div>
                ) : (
                  <>
                    <svg className={`w-10 h-10 ${isDragging ? 'text-brand' : isDark ? 'text-dark-hint' : 'text-light-hint'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${isDragging ? 'text-brand' : isDark ? 'text-dark-muted' : 'text-light-muted'}`}>
                        {isDragging ? 'Drop image here' : 'Click or drag & drop'}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>PNG, JPG, GIF, WEBP</p>
                    </div>
                    <button type="button" className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dim"
                      onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                      Browse file
                    </button>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </>
          )}

          {/* Uploaded tab — shown after successful upload */}
          {tab === 'uploaded' && uploadedUrl && (
            <>
              <div>
                <p className={`text-xs mb-2 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Uploaded successfully</p>
                <div className={`rounded-lg border overflow-hidden mb-3 ${isDark ? 'border-dark-border2' : 'border-light-border2'}`}>
                  <img src={uploadedUrl} alt="uploaded" className="w-full max-h-48 object-contain" />
                </div>
                <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Alt text (optional)" className={inputClass} />
              </div>
              <button
                onClick={() => onInsert(`![${alt || 'image'}](${uploadedUrl})`)}
                className="w-full py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors"
              >
                Insert Image
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
