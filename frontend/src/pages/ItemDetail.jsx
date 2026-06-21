import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { get, put, del, uploadFile } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [item, setItem] = useState(null);
  const [files, setFiles] = useState([]);
  const fileRef = useRef();
  const uploadRef = useRef();

  useEffect(() => {
    get(`/api/items/${id}`).then(setItem).catch(() => navigate('/'));
    get(`/api/items/${id}/files`).then(setFiles).catch(() => {});
  }, [id, navigate]);

  if (!item) return <div className="flex items-center justify-center py-20"><span className={isDark ? 'text-dark-muted' : 'text-light-muted'}>Loading...</span></div>;

  const imgSrc = item.image_url ? `/uploads/${item.image_url}` : '/placeholder.svg';

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (['md', 'markdown', 'txt'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        await put(`/api/items/${id}`, { notes: ev.target.result });
        setItem(prev => ({ ...prev, notes: ev.target.result }));
        toast.success('Notes updated!');
      };
      reader.readAsText(file);
    } else {
      const fd = new FormData();
      fd.append('file', file);
      await uploadFile(`/api/items/${id}/files`, fd);
      const updated = await get(`/api/items/${id}/files`);
      setFiles(updated);
      toast.success('File uploaded!');
    }
    e.target.value = '';
  };

  const handleDeleteFile = async (fileId) => {
    await del(`/api/items/${id}/files/${fileId}`);
    setFiles(files.filter(f => f.id !== fileId));
    toast.success('File deleted');
  };

  const copyMd = () => {
    navigator.clipboard.writeText(item.notes || '');
    toast.success('Copied!');
  };

  const downloadMd = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([item.notes || ''], { type: 'text/markdown' }));
    a.download = item.title.replace(/\s+/g, '_') + '.md';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className={`mb-4 text-sm font-medium flex items-center gap-1 transition-colors ${isDark ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'}`}>
        ← Back
      </button>

      <div className="rounded-xl overflow-hidden mb-6">
        <img src={imgSrc} alt={item.title} className="w-full max-h-80 object-cover" onError={e => { e.target.src = '/placeholder.svg'; }} />
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <h1 className={`font-heading text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{item.title}</h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-bg text-brand border border-brand/30">{item.category}</span>
        {item.status && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isDark ? 'bg-dark-surface2 text-dark-muted' : 'bg-light-surface2 text-light-muted'}`}>{item.status}</span>}
      </div>

      <div className={`text-xs mb-6 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
        Added {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
      </div>

      <div className={`flex flex-wrap gap-2 mb-6 pb-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
        <a
          href={`https://stackedit.io/app#${btoa(unescape(encodeURIComponent('# ' + item.title + '\n\n' + (item.notes || ''))))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dim transition-colors"
        >
          Open in StackEdit ↗
        </a>
        <button onClick={() => uploadRef.current?.click()} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}>
          Upload File
        </button>
        <input ref={uploadRef} type="file" className="hidden" accept=".md,.markdown,.txt,.pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx" onChange={handleFileUpload} />
        <button onClick={copyMd} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}>
          Copy Markdown
        </button>
        <button onClick={downloadMd} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}>
          Download .md
        </button>
      </div>

      <article className={`prose max-w-none mb-8 ${isDark ? 'prose-invert' : ''}`}>
        {item.notes ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.notes}</ReactMarkdown>
        ) : (
          <p className="opacity-40 italic">No notes yet.</p>
        )}
      </article>

      {files.length > 0 && (
        <div className={`border-t pt-6 ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Attachments</h3>
          <div className="space-y-2">
            {files.map(f => (
              <div key={f.id} className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
                <div>
                  <a href={`/uploads/${f.filename}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:text-brand-dim font-medium">{f.original_name}</a>
                  <div className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>{(f.file_size / 1024).toFixed(1)} KB</div>
                </div>
                <button onClick={() => handleDeleteFile(f.id)} className="text-xs text-danger hover:text-danger/80">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
