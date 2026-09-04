import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useTheme } from '../contexts/ThemeContext';
import { uploadFile } from '../api/client';
import MarkdownToolbar from './MarkdownToolbar';
import ContentTypeSelector, { CONTENT_TYPES } from './ContentTypeSelector';

// ── Section parser (same logic as ItemDetail) ────────────────────────────────
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

function joinSections(sections) {
  return sections.map(s => s.content).join('\n\n');
}

function deriveSectionTitle(content) {
  const first = content.trim().split('\n')[0] || '';
  const m = first.match(/^#{1,2}\s+(.+)/);
  return m ? m[1].trim() : (first.slice(0, 28) || 'Untitled');
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ItemModal({ open, onClose, onSave, item, categories, statuses }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Core fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [contentType, setContentType] = useState('markdown');

  // Editor mode: 'write' | 'preview' | 'pages'
  const [editorTab, setEditorTab] = useState('write');

  // Pages mode state
  const [pageSections, setPageSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);

  // Drag / upload
  const [isDragging, setIsDragging] = useState(false);
  const [editorDragging, setEditorDragging] = useState(false);
  const [editorUploading, setEditorUploading] = useState(false);

  const fileInputRef = useRef();
  const mdInputRef = useRef();
  const textareaRef = useRef();    // write mode
  const sectionTaRef = useRef();   // pages mode
  const dragCounterRef = useRef(0);

  // ── Reset on open ──
  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setCategory(item.category || '');
      setStatus(item.status || '');
      setNotes(item.notes || '');
      setContentType(item.content_type || 'markdown');
      setImagePreview(item.image_url ? `/uploads/${item.image_url}` : '');
      setImageFile(null);
    } else {
      setTitle('');
      setCategory(categories?.[0]?.name || '');
      setStatus('');
      setNotes('');
      setContentType('markdown');
      setImagePreview('');
      setImageFile(null);
      setIsDragging(false);
    }
    setEditorTab('write');
    setPageSections([]);
    setCurrentSection(0);
  }, [item, open, categories]);

  if (!open) return null;

  // ── Tab switching ──
  const switchTab = (tab) => {
    // Leaving pages → sync sections back to notes
    if (editorTab === 'pages') {
      const joined = joinSections(pageSections);
      setNotes(joined);
    }
    if (tab === 'pages') {
      const parsed = parseSections(editorTab === 'pages' ? joinSections(pageSections) : notes, contentType);
      setPageSections(parsed);
      setCurrentSection(0);
    }
    setEditorTab(tab);
  };

  // ── Pages: section operations ──
  const updateSectionContent = (val) => {
    setPageSections(prev => prev.map((s, i) =>
      i === currentSection
        ? { ...s, content: val, title: deriveSectionTitle(val) }
        : s
    ));
  };

  const addSection = () => {
    const newSec = { title: 'New Section', level: 2, content: '## New Section\n\n' };
    const idx = pageSections.length;
    setPageSections(prev => [...prev, newSec]);
    setCurrentSection(idx);
    requestAnimationFrame(() => sectionTaRef.current?.focus());
  };

  const deleteSection = (idx) => {
    if (pageSections.length <= 1) return;
    if (!confirm(`Delete section "${pageSections[idx].title}"?`)) return;
    setPageSections(prev => prev.filter((_, i) => i !== idx));
    setCurrentSection(c => Math.max(0, c >= idx ? c - 1 : c));
  };

  const moveSection = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= pageSections.length) return;
    setPageSections(prev => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
    setCurrentSection(next);
  };

  // ── Image select ──
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Import file ──
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (['md', 'markdown', 'txt'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        if (editorTab === 'pages') {
          setPageSections(parseSections(text, contentType));
          setCurrentSection(0);
        } else {
          setNotes(text);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // ── Save ──
  const handleSave = async () => {
    if (!title.trim()) return;
    setUploading(true);
    const finalNotes = editorTab === 'pages' ? joinSections(pageSections) : notes;
    try {
      const savedItem = await onSave({ title, category, status, notes: finalNotes, content_type: contentType, favorite: item?.favorite || false });
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

  // ── Write-mode keyboard / insert helpers ──
  const handleKeyDown = (e) => {
    const isSection = editorTab === 'pages';
    const ta = isSection ? sectionTaRef.current : textareaRef.current;
    const val = isSection ? pageSections[currentSection]?.content || '' : notes;
    const setVal = isSection ? updateSectionContent : setNotes;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = val.substring(0, start) + '  ' + val.substring(end);
      setVal(next);
      requestAnimationFrame(() => { if (ta) { ta.selectionStart = ta.selectionEnd = start + 2; } });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); wrapSelection('**', '**', 'bold text', isSection); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); wrapSelection('*', '*', 'italic text', isSection); }
  };

  const wrapSelection = (prefix, suffix, placeholder, isSection = false) => {
    const ta = isSection ? sectionTaRef.current : textareaRef.current;
    const val = isSection ? pageSections[currentSection]?.content || '' : notes;
    const setVal = isSection ? updateSectionContent : setNotes;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = val.substring(start, end);
    const insert = prefix + (selected || placeholder) + suffix;
    const newVal = val.substring(0, start) + insert + val.substring(end);
    setVal(newVal);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start + prefix.length, start + prefix.length + (selected || placeholder).length); });
  };

  const insertAtCursor = (text, isSection = false) => {
    const ta = isSection ? sectionTaRef.current : textareaRef.current;
    const val = isSection ? pageSections[currentSection]?.content || '' : notes;
    const setVal = isSection ? updateSectionContent : setNotes;
    if (!ta) { setVal(val + '\n' + text + '\n'); return; }
    const start = ta.selectionStart;
    const before = val.substring(0, start);
    const after = val.substring(ta.selectionEnd);
    const newVal = before + (before.length > 0 && before[before.length - 1] !== '\n' ? '\n' : '') + text + '\n' + after;
    setVal(newVal);
    requestAnimationFrame(() => { if (ta) ta.focus(); });
  };

  // ── Drag-drop onto editor ──
  const handleEditorDrop = async (e, isSection = false) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setEditorDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    setEditorUploading(true);
    try {
      for (const file of files) {
        const isImage = file.type.startsWith('image/');
        const fd = new FormData();
        fd.append('file', file);
        const res = await uploadFile('/api/upload-file', fd);
        if (res.url) {
          const md = isImage ? `![${file.name}](${res.url})` : `[📎 ${file.name}](${res.url})`;
          insertAtCursor(md, isSection);
        }
      }
    } finally {
      setEditorUploading(false);
    }
  };

  // ── Styles ──
  const fieldLabel = `block text-[13px] font-semibold mb-2 ${isDark ? 'text-dark-text' : 'text-light-text'}`;
  const inputBase = `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand-glow ${isDark ? 'bg-dark-bg border-dark-border2 text-dark-text placeholder:text-dark-hint' : 'bg-white border-light-border2 text-light-text placeholder:text-light-hint'}`;
  const tabBtn = (active) => `px-3 py-1 text-xs font-medium transition-colors ${active ? 'bg-brand text-white' : isDark ? 'text-dark-muted hover:bg-dark-surface2' : 'text-light-muted hover:bg-light-surface2'}`;

  const sectionContent = pageSections[currentSection]?.content || '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div
        className={`w-full max-w-[720px] rounded-xl shadow-2xl border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-light-border'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <h2 className={`font-heading text-lg font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>
            {item ? 'Edit Item' : 'Create New Item'}
          </h2>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? 'text-dark-muted hover:bg-dark-surface2 hover:text-dark-text' : 'text-light-muted hover:bg-light-surface2 hover:text-light-text'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* ── Form body ── */}
        <div className="px-6 py-5 space-y-5">
          <p className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
            All fields marked with <span className="text-danger">*</span> are required
          </p>

          {/* Cover Image */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={fieldLabel + ' mb-0'}>Cover Image</label>
              {imagePreview && (
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="text-xs text-danger hover:text-danger/80 transition-colors">
                  Remove image
                </button>
              )}
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault(); setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith('image/')) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
              }}
              className={`relative rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-200 ${
                isDragging ? 'border-brand bg-brand-bg scale-[1.01]'
                : imagePreview ? `border-transparent ${isDark ? 'border-dark-border2' : 'border-light-border2'}`
                : isDark ? 'border-dark-border2 hover:border-brand/60 hover:bg-brand-bg/30 bg-dark-bg'
                : 'border-light-border2 hover:border-brand/60 hover:bg-brand-bg/30 bg-light-surface2'
              }`}
              style={{ minHeight: imagePreview ? 0 : '160px' }}
            >
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} alt="Cover preview" className="w-full max-h-56 object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full">Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-3 select-none">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-dark-surface2' : 'bg-light-surface3'} ${isDragging ? 'bg-brand/20' : ''}`}>
                    <svg className={`w-7 h-7 ${isDragging ? 'text-brand' : isDark ? 'text-dark-hint' : 'text-light-hint'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${isDragging ? 'text-brand' : isDark ? 'text-dark-muted' : 'text-light-muted'}`}>
                      {isDragging ? 'Drop image here' : 'Click to upload or drag & drop'}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>PNG, JPG, GIF, WEBP</p>
                  </div>
                  <button type="button" className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dim transition-colors" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Browse file
                  </button>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>

          {/* Title */}
          <div>
            <label className={fieldLabel}>Title <span className="text-danger">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Elden Ring Equipment Guide" className={inputBase} autoFocus />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputBase}>
                {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputBase}>
                <option value="">No status</option>
                {statuses?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* ── Description editor ── */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className={fieldLabel + ' mb-0'}>Description</label>
              <div className="flex items-center gap-2 flex-wrap">
                <ContentTypeSelector value={contentType} onChange={setContentType} />

                {/* Tabs: Write / Preview / Pages */}
                <div className={`flex rounded-md overflow-hidden border ${isDark ? 'border-dark-border2' : 'border-light-border2'}`}>
                  {['write', 'preview', 'pages'].map((tab, idx) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => switchTab(tab)}
                      className={`${tabBtn(editorTab === tab)} ${idx > 0 ? `border-l ${isDark ? 'border-dark-border2' : 'border-light-border2'}` : ''}`}
                    >
                      {tab === 'pages' ? '📄 Pages' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => mdInputRef.current?.click()}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}>
                  Import file
                </button>
                <input ref={mdInputRef} type="file" accept=".md,.markdown,.txt,.html" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>

            {/* ════════════════════ WRITE TAB ════════════════════ */}
            {editorTab === 'write' && (
              <div
                className={`rounded-lg border overflow-hidden relative transition-all ${
                  editorDragging ? 'border-brand ring-2 ring-brand/40' : isDark ? 'border-dark-border2' : 'border-light-border2'
                }`}
                onDragEnter={e => { e.preventDefault(); dragCounterRef.current++; setEditorDragging(true); }}
                onDragOver={e => e.preventDefault()}
                onDragLeave={() => { dragCounterRef.current--; if (dragCounterRef.current === 0) setEditorDragging(false); }}
                onDrop={e => handleEditorDrop(e, false)}
              >
                {contentType === 'markdown' && (
                  <MarkdownToolbar textareaRef={textareaRef} value={notes} onChange={setNotes} />
                )}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onKeyDown={contentType === 'markdown' ? handleKeyDown : undefined}
                    placeholder={
                      contentType === 'markdown' ? 'Write Markdown here…  Tip: Use ## Heading to create separate pages'
                      : contentType === 'html' ? '<h1>Title</h1>\n<p>Your HTML content...</p>'
                      : contentType === 'json' ? '{\n  "key": "value"\n}'
                      : 'Write plain text here…'
                    }
                    rows={12}
                    className={`w-full px-4 py-3 text-sm outline-none resize-y min-h-[240px] leading-relaxed ${
                      contentType !== 'text' ? 'font-mono' : ''
                    } ${isDark ? 'bg-dark-bg text-dark-text placeholder:text-dark-hint' : 'bg-white text-light-text placeholder:text-light-hint'}`}
                  />
                  {editorDragging && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark-bg/90 pointer-events-none z-10 rounded-b-lg">
                      <div className="w-14 h-14 rounded-2xl bg-brand/20 flex items-center justify-center">
                        <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                      </div>
                      <p className="text-brand font-semibold text-sm">Drop to insert</p>
                    </div>
                  )}
                  {editorUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark-bg/80 z-10 rounded-b-lg">
                      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      <p className={`text-sm ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Uploading…</p>
                    </div>
                  )}
                </div>
                <div className={`px-3 py-1.5 flex items-center gap-1.5 text-xs border-t ${isDark ? 'bg-dark-bg2 border-dark-border2 text-dark-hint' : 'bg-light-bg2 border-light-border2 text-light-hint'}`}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  Drag & drop images or files here to upload and insert
                </div>
              </div>
            )}

            {/* ════════════════════ PREVIEW TAB ════════════════════ */}
            {editorTab === 'preview' && (
              <div className={`rounded-lg border p-5 min-h-[240px] max-h-[480px] overflow-y-auto ${isDark ? 'border-dark-border2 bg-dark-bg' : 'border-light-border2 bg-white'}`}>
                {notes ? (
                  <>
                    {contentType === 'markdown' && (
                      <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''} prose-headings:font-heading prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-sm prose-p:leading-relaxed prose-code:text-brand prose-code:text-xs prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-a:text-brand prose-blockquote:border-brand prose-blockquote:bg-brand-bg prose-blockquote:rounded-r-lg prose-img:rounded-lg prose-table:text-sm ${isDark ? 'prose-code:bg-dark-surface3 prose-pre:bg-dark-surface2 prose-th:bg-dark-surface2' : 'prose-code:bg-light-surface3 prose-pre:bg-light-surface2 prose-th:bg-light-surface2'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
                          components={{ img({ src, alt, ...props }) {
                            const ok = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'));
                            return ok ? <img src={src} alt={alt||''} className="max-w-full rounded-lg my-2 object-contain" style={{maxHeight:'320px'}} {...props}/> : null;
                          }}}
                        >{notes}</ReactMarkdown>
                      </div>
                    )}
                    {contentType === 'html' && <div className={`text-sm ${isDark ? 'text-dark-text' : 'text-light-text'}`} dangerouslySetInnerHTML={{ __html: notes }} />}
                    {contentType === 'text' && <pre className={`text-sm whitespace-pre-wrap font-sans leading-relaxed ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{notes}</pre>}
                    {contentType === 'json' && (() => {
                      try { return <pre className={`text-sm font-mono leading-relaxed ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{JSON.stringify(JSON.parse(notes), null, 2)}</pre>; }
                      catch { return <p className="text-danger text-sm">Invalid JSON — check your syntax</p>; }
                    })()}
                  </>
                ) : (
                  <p className={`text-sm italic opacity-40 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Nothing to preview.</p>
                )}
              </div>
            )}

            {/* ════════════════════ PAGES TAB ════════════════════ */}
            {editorTab === 'pages' && (
              <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-dark-border2' : 'border-light-border2'}`}>

                {/* Section list header */}
                <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'bg-dark-bg2 border-dark-border2' : 'bg-light-surface2 border-light-border2'}`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
                    </svg>
                    <span className={`text-xs font-semibold ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>
                      Pages — {pageSections.length} section{pageSections.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addSection}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-brand/15 text-brand hover:bg-brand/25 transition-colors"
                  >
                    <span>+</span> Add Page
                  </button>
                </div>

                {/* Section tabs (scrollable row) */}
                <div className={`flex gap-1 px-2 py-1.5 overflow-x-auto border-b ${isDark ? 'bg-dark-bg2 border-dark-border2' : 'bg-light-surface2 border-light-border2'}`}>
                  {pageSections.map((s, i) => (
                    <div key={i} className="flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setCurrentSection(i)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors max-w-[140px] ${
                          i === currentSection
                            ? 'bg-brand text-white'
                            : isDark ? 'text-dark-hint hover:bg-dark-surface2 hover:text-dark-muted' : 'text-light-hint hover:bg-light-surface2 hover:text-light-muted'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${
                          i === currentSection ? 'bg-white/25 text-white' : isDark ? 'bg-dark-surface2 text-dark-hint' : 'bg-light-surface3 text-light-hint'
                        }`}>{i + 1}</span>
                        <span className="truncate">{s.title || `Page ${i + 1}`}</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Current section editor */}
                {pageSections.length > 0 && (
                  <>
                    {/* Section editor label + controls */}
                    <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isDark ? 'bg-dark-bg border-dark-border2' : 'bg-white border-light-border2'}`}>
                      <span className={`text-xs font-medium ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
                        Editing: <span className={`font-semibold ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{pageSections[currentSection]?.title || `Page ${currentSection + 1}`}</span>
                        <span className="ml-1 opacity-60">({currentSection + 1} of {pageSections.length})</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveSection(currentSection, -1)} disabled={currentSection === 0}
                          className={`w-6 h-6 flex items-center justify-center rounded text-xs disabled:opacity-30 transition-colors ${isDark ? 'text-dark-hint hover:bg-dark-surface2 hover:text-dark-muted' : 'text-light-hint hover:bg-light-surface2 hover:text-light-muted'}`}
                          title="Move page up">↑</button>
                        <button type="button" onClick={() => moveSection(currentSection, 1)} disabled={currentSection === pageSections.length - 1}
                          className={`w-6 h-6 flex items-center justify-center rounded text-xs disabled:opacity-30 transition-colors ${isDark ? 'text-dark-hint hover:bg-dark-surface2 hover:text-dark-muted' : 'text-light-hint hover:bg-light-surface2 hover:text-light-muted'}`}
                          title="Move page down">↓</button>
                        {pageSections.length > 1 && (
                          <button type="button" onClick={() => deleteSection(currentSection)}
                            className="w-6 h-6 flex items-center justify-center rounded text-xs text-danger hover:bg-danger-bg transition-colors"
                            title="Delete this page">✕</button>
                        )}
                      </div>
                    </div>

                    {/* Markdown toolbar for section */}
                    {contentType === 'markdown' && (
                      <MarkdownToolbar
                        textareaRef={sectionTaRef}
                        value={sectionContent}
                        onChange={updateSectionContent}
                      />
                    )}

                    {/* Section textarea */}
                    <div
                      className="relative"
                      onDragEnter={e => { e.preventDefault(); dragCounterRef.current++; setEditorDragging(true); }}
                      onDragOver={e => e.preventDefault()}
                      onDragLeave={() => { dragCounterRef.current--; if (dragCounterRef.current === 0) setEditorDragging(false); }}
                      onDrop={e => handleEditorDrop(e, true)}
                    >
                      <textarea
                        ref={sectionTaRef}
                        key={currentSection}
                        value={sectionContent}
                        onChange={e => updateSectionContent(e.target.value)}
                        onKeyDown={contentType === 'markdown' ? handleKeyDown : undefined}
                        placeholder={`## ${pageSections[currentSection]?.title || 'Section Title'}\n\nWrite this section's content here…`}
                        rows={10}
                        className={`w-full px-4 py-3 text-sm outline-none resize-y min-h-[200px] leading-relaxed font-mono ${isDark ? 'bg-dark-bg text-dark-text placeholder:text-dark-hint' : 'bg-white text-light-text placeholder:text-light-hint'}`}
                      />
                      {editorDragging && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark-bg/90 pointer-events-none z-10">
                          <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                          </div>
                          <p className="text-brand font-semibold text-sm">Drop to insert</p>
                        </div>
                      )}
                      {editorUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 z-10">
                          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Section preview */}
                    {sectionContent.trim() && (
                      <div className={`border-t px-4 py-3 max-h-48 overflow-y-auto ${isDark ? 'border-dark-border2 bg-dark-bg/50' : 'border-light-border2 bg-light-surface2/50'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Preview</p>
                        <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''} prose-headings:font-heading prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:text-xs prose-p:leading-relaxed prose-code:text-brand prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-table:text-xs ${isDark ? 'prose-code:bg-dark-surface3 prose-pre:bg-dark-surface2 prose-th:bg-dark-surface2' : 'prose-code:bg-light-surface3 prose-pre:bg-light-surface2 prose-th:bg-light-surface2'}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
                            components={{ img({ src, alt, ...props }) {
                              const ok = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'));
                              return ok ? <img src={src} alt={alt||''} className="max-w-full rounded object-contain" style={{maxHeight:'200px'}} {...props}/> : null;
                            }}}
                          >{sectionContent}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Section nav bar */}
                    <div className={`flex items-center justify-between px-3 py-2 border-t ${isDark ? 'bg-dark-bg2 border-dark-border2' : 'bg-light-surface2 border-light-border2'}`}>
                      <button type="button" onClick={() => setCurrentSection(c => Math.max(0, c - 1))} disabled={currentSection === 0}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border transition-colors disabled:opacity-30 ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}>
                        ← Prev
                      </button>
                      <span className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
                        Page <strong className={isDark ? 'text-dark-muted' : 'text-light-muted'}>{currentSection + 1}</strong> of {pageSections.length}
                      </span>
                      <button type="button" onClick={() => setCurrentSection(c => Math.min(pageSections.length - 1, c + 1))} disabled={currentSection === pageSections.length - 1}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border transition-colors disabled:opacity-30 ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'}`}>
                        Next →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <button onClick={onClose} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-dark-muted hover:bg-dark-surface2 hover:text-dark-text' : 'text-light-muted hover:bg-light-surface2 hover:text-light-text'}`}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={uploading || !title.trim()}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? 'Saving…' : item ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
