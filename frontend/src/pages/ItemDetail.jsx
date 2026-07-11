import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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

      {/* Content type badge */}
      {item.content_type && item.content_type !== 'markdown' && (
        <div className="mb-4">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
            item.content_type === 'html' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
            : item.content_type === 'json' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
            : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
          }`}>
            {item.content_type === 'html' ? '.html' : item.content_type === 'json' ? '.json' : '.txt'}
          </span>
        </div>
      )}

      <article className={`prose prose-lg max-w-none mb-8
        ${isDark ? 'prose-invert' : ''}
        prose-headings:font-heading
        prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-8
        prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3 prose-h2:mt-6 prose-h2:pb-2 ${isDark ? 'prose-h2:border-b prose-h2:border-dark-border' : 'prose-h2:border-b prose-h2:border-light-border'}
        prose-h3:text-lg prose-h3:font-semibold prose-h3:text-brand prose-h3:mb-2 prose-h3:mt-5
        prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-brand prose-a:no-underline hover:prose-a:underline
        prose-strong:font-semibold ${isDark ? 'prose-strong:text-dark-text' : 'prose-strong:text-light-text'}
        prose-code:text-brand prose-code:text-sm prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:before:content-none prose-code:after:content-none ${isDark ? 'prose-code:bg-dark-surface2 prose-code:border prose-code:border-dark-border2' : 'prose-code:bg-light-surface2 prose-code:border prose-code:border-light-border2'}
        prose-pre:rounded-xl prose-pre:p-5 prose-pre:overflow-x-auto prose-pre:mb-4 ${isDark ? 'prose-pre:bg-dark-surface2 prose-pre:border prose-pre:border-dark-border' : 'prose-pre:bg-light-surface2 prose-pre:border prose-pre:border-light-border'}
        prose-blockquote:border-l-3 prose-blockquote:border-brand prose-blockquote:rounded-r-lg prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:not-italic ${isDark ? 'prose-blockquote:bg-brand-bg' : 'prose-blockquote:bg-brand-bg'}
        prose-img:rounded-xl prose-img:my-4 ${isDark ? 'prose-img:border prose-img:border-dark-border' : 'prose-img:border prose-img:border-light-border'}
        prose-table:text-sm prose-th:text-left prose-th:font-semibold prose-th:px-4 prose-th:py-2.5 ${isDark ? 'prose-th:bg-dark-surface2 prose-td:border-dark-border prose-th:text-dark-text' : 'prose-th:bg-light-surface2 prose-td:border-light-border prose-th:text-light-text'} prose-td:px-4 prose-td:py-2
        prose-li:mb-1
        prose-hr:my-8 ${isDark ? 'prose-hr:border-dark-border' : 'prose-hr:border-light-border'}
      `}>
        {item.notes ? (
          <>
            {(!item.content_type || item.content_type === 'markdown') && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  img({ src, alt, ...props }) {
                    const isValidUrl = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'));
                    if (!isValidUrl) return null;
                    return (
                      <span className="block my-4">
                        <img src={src} alt={alt || ''} className="max-w-full rounded-xl object-contain"
                          style={{ maxHeight: '480px', border: '1px solid rgba(255,255,255,0.07)' }} {...props} />
                      </span>
                    );
                  },
                  a({ href, children, ...props }) {
                    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline" {...props}>{children}</a>;
                  },
                }}
              >
                {item.notes}
              </ReactMarkdown>
            )}
            {item.content_type === 'html' && (
              <div dangerouslySetInnerHTML={{ __html: item.notes }} />
            )}
            {item.content_type === 'text' && (
              <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{item.notes}</pre>
            )}
            {item.content_type === 'json' && (() => {
              try {
                return <pre className="font-mono text-sm leading-relaxed overflow-x-auto">{JSON.stringify(JSON.parse(item.notes), null, 2)}</pre>;
              } catch {
                return <pre className="font-mono text-sm text-danger">{item.notes}</pre>;
              }
            })()}
          </>
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
