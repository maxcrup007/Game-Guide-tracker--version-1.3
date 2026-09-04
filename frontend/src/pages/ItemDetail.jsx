import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { get, put, del, uploadFile } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import EditRequestModal from '../components/EditRequestModal';
import toast from 'react-hot-toast';

// ── Parse markdown into sections on H1 / H2 headings ────────────────────────
function parseSections(content, contentType) {
  if (!content) return [{ title: 'Content', content: '', level: 0 }];
  if (contentType && contentType !== 'markdown') {
    return [{ title: 'Content', content, level: 0 }];
  }

  const lines = content.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const m1 = line.match(/^# (.+)/);
    const m2 = line.match(/^## (.+)/);
    if (m1 || m2) {
      if (current) sections.push({ ...current, content: current.content.trimEnd() });
      current = { title: (m1 || m2)[1].trim(), level: m1 ? 1 : 2, content: line + '\n' };
    } else {
      if (!current) current = { title: 'Introduction', level: 0, content: '' };
      current.content += line + '\n';
    }
  }
  if (current) sections.push({ ...current, content: current.content.trimEnd() });

  const valid = sections.filter(s => s.content.trim());
  return valid.length ? valid : [{ title: 'Content', content, level: 0 }];
}

// ── Shared prose class string ────────────────────────────────────────────────
const proseBase = (isDark) => `
  prose prose-lg max-w-none
  ${isDark ? 'prose-invert' : ''}
  prose-headings:font-heading
  prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-6
  prose-h2:text-xl prose-h2:font-bold prose-h2:mb-3 prose-h2:mt-5 prose-h2:pb-2
  ${isDark ? 'prose-h2:border-b prose-h2:border-dark-border' : 'prose-h2:border-b prose-h2:border-light-border'}
  prose-h3:text-lg prose-h3:font-semibold prose-h3:text-brand prose-h3:mb-2 prose-h3:mt-4
  prose-p:leading-relaxed prose-p:mb-4
  prose-a:text-brand prose-a:no-underline hover:prose-a:underline
  prose-strong:font-semibold ${isDark ? 'prose-strong:text-dark-text' : 'prose-strong:text-light-text'}
  prose-code:text-brand prose-code:text-sm prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
  ${isDark ? 'prose-code:bg-dark-surface2 prose-code:border prose-code:border-dark-border2' : 'prose-code:bg-light-surface2 prose-code:border prose-code:border-light-border2'}
  prose-pre:rounded-xl prose-pre:p-5 prose-pre:overflow-x-auto prose-pre:mb-4
  ${isDark ? 'prose-pre:bg-dark-surface2 prose-pre:border prose-pre:border-dark-border' : 'prose-pre:bg-light-surface2 prose-pre:border prose-pre:border-light-border'}
  prose-blockquote:border-l-4 prose-blockquote:border-brand prose-blockquote:rounded-r-lg prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:not-italic
  ${isDark ? 'prose-blockquote:bg-brand-bg' : 'prose-blockquote:bg-brand-bg'}
  prose-img:rounded-xl prose-img:my-4
  ${isDark ? 'prose-img:border prose-img:border-dark-border' : 'prose-img:border prose-img:border-light-border'}
  prose-table:text-sm prose-th:text-left prose-th:font-semibold prose-th:px-4 prose-th:py-2.5
  ${isDark ? 'prose-th:bg-dark-surface2 prose-td:border-dark-border prose-th:text-dark-text' : 'prose-th:bg-light-surface2 prose-td:border-light-border prose-th:text-light-text'}
  prose-td:px-4 prose-td:py-2 prose-li:mb-1
  prose-hr:my-8 ${isDark ? 'prose-hr:border-dark-border' : 'prose-hr:border-light-border'}
`;

const mdComponents = {
  img({ src, alt, ...props }) {
    const ok = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'));
    if (!ok) return null;
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
};

// ── Component ────────────────────────────────────────────────────────────────
export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const isDark = theme === 'dark';
  const mainRef = useRef(null);

  const [item, setItem] = useState(null);
  const [files, setFiles] = useState([]);
  const [reqModal, setReqModal] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const uploadRef = useRef();

  useEffect(() => {
    get(`/api/items/${id}`).then(d => { setItem(d); setCurrentPage(0); setPageInput('1'); }).catch(() => navigate('/'));
    get(`/api/items/${id}/files`).then(setFiles).catch(() => {});
  }, [id, navigate]);

  const sections = useMemo(
    () => parseSections(item?.notes, item?.content_type),
    [item?.notes, item?.content_type]
  );
  const totalPages = sections.length;
  const hasPages = totalPages > 1;
  const section = sections[currentPage] || sections[0];

  const scrollTop = () => {
    // scroll the nearest scrollable parent to top
    const el = mainRef.current;
    if (!el) return;
    let p = el.parentElement;
    while (p) {
      if (p.scrollHeight > p.clientHeight) { p.scrollTop = 0; break; }
      p = p.parentElement;
    }
  };

  const goTo = useCallback((n) => {
    const idx = Math.max(0, Math.min(totalPages - 1, n));
    setCurrentPage(idx);
    setPageInput(String(idx + 1));
    setTocOpen(false);
    scrollTop();
  }, [totalPages]);

  if (!item) return (
    <div className="flex items-center justify-center py-20">
      <span className={isDark ? 'text-dark-muted' : 'text-light-muted'}>Loading…</span>
    </div>
  );

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

  const copyContent = () => {
    navigator.clipboard.writeText(item.notes || '');
    toast.success('Copied!');
  };

  const downloadMd = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([item.notes || ''], { type: 'text/markdown' }));
    a.download = item.title.replace(/\s+/g, '_') + '.md';
    a.click();
  };

  const handlePageInputKey = (e) => {
    if (e.key === 'Enter') {
      const n = parseInt(pageInput, 10);
      if (!isNaN(n)) goTo(n - 1);
    }
  };

  // ── Render content for current section ──
  const renderContent = (content) => {
    if (!content) return <p className="opacity-40 italic">No content yet.</p>;
    const ct = item.content_type;
    if (!ct || ct === 'markdown') {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdComponents}>
          {content}
        </ReactMarkdown>
      );
    }
    if (ct === 'html') return <div dangerouslySetInnerHTML={{ __html: content }} />;
    if (ct === 'text') return <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{content}</pre>;
    if (ct === 'json') {
      try {
        return <pre className="font-mono text-sm leading-relaxed overflow-x-auto">{JSON.stringify(JSON.parse(content), null, 2)}</pre>;
      } catch {
        return <pre className="font-mono text-sm text-danger">{content}</pre>;
      }
    }
    return null;
  };

  const btnBase = `flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed`;
  const navBtn = `${btnBase} h-8 px-3 text-sm border ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2 hover:text-dark-text' : 'border-light-border2 text-light-muted hover:bg-light-surface2 hover:text-light-text'}`;
  const tocBtn = (active) => `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
    active
      ? 'bg-brand-bg text-brand font-semibold'
      : isDark ? 'text-dark-muted hover:bg-dark-surface2' : 'text-light-muted hover:bg-light-surface2'
  }`;

  return (
    <div ref={mainRef} className="max-w-4xl mx-auto pb-24">

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        className={`mb-4 text-sm font-medium flex items-center gap-1 transition-colors ${isDark ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'}`}
      >
        ← Back
      </button>

      {/* ── Hero image ── */}
      <div className="rounded-xl overflow-hidden mb-6">
        <img src={imgSrc} alt={item.title} className="w-full max-h-72 object-cover" onError={e => { e.target.src = '/placeholder.svg'; }} />
      </div>

      {/* ── Title / category / status ── */}
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <h1 className={`font-heading text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{item.title}</h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-bg text-brand border border-brand/30">{item.category}</span>
        {item.status && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isDark ? 'bg-dark-surface2 text-dark-muted' : 'bg-light-surface2 text-light-muted'}`}>{item.status}</span>}
        {item.content_type && item.content_type !== 'markdown' && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
            item.content_type === 'html' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
            : item.content_type === 'json' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
            : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
          }`}>
            {item.content_type === 'html' ? '.html' : item.content_type === 'json' ? '.json' : '.txt'}
          </span>
        )}
      </div>

      <div className={`text-xs mb-5 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
        Added {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
      </div>

      {/* ── Action bar ── */}
      <div className={`flex flex-wrap gap-2 mb-6 pb-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
        <a
          href={`https://stackedit.io/app#${btoa(unescape(encodeURIComponent('# ' + item.title + '\n\n' + (item.notes || ''))))}`}
          target="_blank" rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dim transition-colors"
        >
          Open in StackEdit ↗
        </a>
        {isAdmin && (
          <>
            <button onClick={() => uploadRef.current?.click()} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}>
              Upload File
            </button>
            <input ref={uploadRef} type="file" className="hidden" accept=".md,.markdown,.txt,.pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx" onChange={handleFileUpload} />
          </>
        )}
        <button onClick={copyContent} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}>
          Copy Content
        </button>
        <button onClick={downloadMd} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}>
          Download .md
        </button>
        {!isAdmin && (
          <button onClick={() => setReqModal(true)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-brand/40 text-brand hover:bg-brand-bg' : 'border-brand/40 text-brand hover:bg-brand-bg'}`}>
            Request Edit
          </button>
        )}
      </div>

      {/* ── Topics / Table of Contents panel ── */}
      {hasPages && (
        <div className={`mb-6 rounded-xl border overflow-hidden ${isDark ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'}`}>
          {/* TOC Header */}
          <button
            onClick={() => setTocOpen(o => !o)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors ${
              isDark ? 'hover:bg-dark-surface2 text-dark-text' : 'hover:bg-light-surface2 text-light-text'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              <span>Topics</span>
              <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${isDark ? 'bg-dark-surface2 text-dark-hint' : 'bg-light-surface2 text-light-hint'}`}>
                {totalPages} sections
              </span>
              {hasPages && (
                <span className="text-xs font-normal text-brand">
                  — Reading: {currentPage + 1} of {totalPages}
                </span>
              )}
            </div>
            <svg className={`w-4 h-4 transition-transform duration-200 ${tocOpen ? 'rotate-180' : ''} ${isDark ? 'text-dark-hint' : 'text-light-hint'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* TOC section list */}
          {tocOpen && (
            <div className={`border-t p-2 max-h-72 overflow-y-auto ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
              {sections.map((s, i) => (
                <button key={i} onClick={() => goTo(i)} className={tocBtn(i === currentPage)}>
                  <span className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                    i === currentPage
                      ? 'bg-brand text-white'
                      : isDark ? 'bg-dark-surface2 text-dark-hint' : 'bg-light-surface2 text-light-hint'
                  }`}>{i + 1}</span>
                  <span className="truncate">{s.title}</span>
                  {s.level === 2 && <span className={`ml-auto text-[10px] shrink-0 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>##</span>}
                  {s.level === 1 && <span className={`ml-auto text-[10px] shrink-0 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>#</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Section label (when multi-page) ── */}
      {hasPages && (
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
            <span className="w-5 h-5 rounded-md bg-brand text-white text-[10px] font-bold flex items-center justify-center">{currentPage + 1}</span>
            <span className="font-semibold text-brand">{section.title}</span>
            <span>· Section {currentPage + 1} of {totalPages}</span>
          </div>
        </div>
      )}

      {/* ── Article content ── */}
      <article className={proseBase(isDark)}>
        {item.notes ? renderContent(section.content) : (
          <p className="opacity-40 italic">No notes yet.</p>
        )}
      </article>

      {/* ── Prev / Next inline buttons between sections ── */}
      {hasPages && (
        <div className={`flex gap-3 mt-8 pt-6 border-t ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 0}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors disabled:opacity-30 text-left pl-4 ${
              isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2 hover:text-dark-text' : 'border-light-border2 text-light-muted hover:bg-light-surface2 hover:text-light-text'
            }`}
          >
            {currentPage > 0 && (
              <>
                <div className={`text-[10px] mb-0.5 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>← Previous</div>
                <div className="truncate">{sections[currentPage - 1]?.title}</div>
              </>
            )}
          </button>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors disabled:opacity-30 text-right pr-4 ${
              isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2 hover:text-dark-text' : 'border-light-border2 text-light-muted hover:bg-light-surface2 hover:text-light-text'
            }`}
          >
            {currentPage < totalPages - 1 && (
              <>
                <div className={`text-[10px] mb-0.5 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Next →</div>
                <div className="truncate">{sections[currentPage + 1]?.title}</div>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Attachments ── */}
      {files.length > 0 && (
        <div className={`border-t pt-6 mt-6 ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Attachments</h3>
          <div className="space-y-2">
            {files.map(f => (
              <div key={f.id} className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
                <div>
                  <a href={`/uploads/${f.filename}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:text-brand-dim font-medium">{f.original_name}</a>
                  <div className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>{(f.file_size / 1024).toFixed(1)} KB</div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeleteFile(f.id)} className="text-xs text-danger hover:text-danger/80">Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sticky bottom navigation bar (PDF-viewer style) ── */}
      {hasPages && (
        <div className={`sticky bottom-0 mt-8 -mx-4 lg:-mx-8 px-4 lg:px-8 py-3 border-t flex items-center gap-3 ${
          isDark ? 'bg-dark-bg/95 border-dark-border backdrop-blur-xl' : 'bg-light-bg/95 border-light-border backdrop-blur-xl'
        }`}>
          {/* Left: back */}
          <button
            onClick={() => navigate(-1)}
            className={`${navBtn} w-8 h-8 px-0 shrink-0`}
            title="Back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Center: navigation controls */}
          <div className="flex-1 flex items-center justify-center gap-1">
            {/* First page */}
            <button
              onClick={() => goTo(0)}
              disabled={currentPage === 0}
              className={navBtn}
              title="First section"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Prev */}
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 0}
              className={navBtn}
              title="Previous section"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page input */}
            <div className={`flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm ${isDark ? 'bg-dark-surface border-dark-border2' : 'bg-white border-light-border2'}`}>
              <input
                type="text"
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onKeyDown={handlePageInputKey}
                onBlur={() => { const n = parseInt(pageInput, 10); if (!isNaN(n)) goTo(n - 1); else setPageInput(String(currentPage + 1)); }}
                className={`w-8 text-center bg-transparent outline-none font-semibold ${isDark ? 'text-dark-text' : 'text-light-text'}`}
              />
              <span className={`${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>of</span>
              <span className={`font-semibold ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{totalPages}</span>
            </div>

            {/* Next */}
            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className={navBtn}
              title="Next section"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {/* Last page */}
            <button
              onClick={() => goTo(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
              className={navBtn}
              title="Last section"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right: topics toggle */}
          <button
            onClick={() => { setTocOpen(o => !o); scrollTop(); }}
            className={`${navBtn} gap-1.5 shrink-0 ${tocOpen ? 'bg-brand-bg text-brand border-brand/40' : ''}`}
            title="Topics"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
            </svg>
            <span className="hidden sm:inline text-xs">Topics</span>
          </button>
        </div>
      )}

      <EditRequestModal open={reqModal} onClose={() => setReqModal(false)} item={item} />
    </div>
  );
}
