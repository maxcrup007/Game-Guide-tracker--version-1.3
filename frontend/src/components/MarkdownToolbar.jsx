import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ImageInsertDialog from './ImageInsertDialog';

const headingOptions = [
  { label: 'Normal text', prefix: '', suffix: '', placeholder: '' },
  { label: 'Heading 1', prefix: '# ', suffix: '', placeholder: 'Heading', block: true },
  { label: 'Heading 2', prefix: '## ', suffix: '', placeholder: 'Heading', block: true },
  { label: 'Heading 3', prefix: '### ', suffix: '', placeholder: 'Heading', block: true },
  { label: 'Heading 4', prefix: '#### ', suffix: '', placeholder: 'Heading', block: true },
];

function BoldIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>;
}
function ItalicIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>;
}
function UnderlineIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>;
}
function StrikeIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>;
}
function LinkIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>;
}
function ImageIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>;
}
function BulletListIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>;
}
function NumberListIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>;
}
function ChecklistIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-9v2h9V7zm0 8h-9v2h9v-2zM5.54 11L2 7.46l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41L5.54 11zm0 8L2 15.46l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41L5.54 19z"/></svg>;
}
function CodeIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>;
}
function QuoteIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>;
}
function TableIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"/></svg>;
}
function HrIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2 11h20v2H2z"/></svg>;
}
function CodeBlockIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10l2-2 1.4 1.4L7.8 11l1.6 1.6L8 14l-2-2zm6 4l-1.4-1.4 1.6-1.6-1.6-1.6L12 8l2 2-2 2 2 2-2 2zm2-4l2 2-1.4 1.4L16.2 12l-1.6-1.6L16 9l2 2z"/></svg>;
}

const inlineTools = [
  { icon: BoldIcon, title: 'Bold (Ctrl+B)', prefix: '**', suffix: '**', placeholder: 'bold text' },
  { icon: ItalicIcon, title: 'Italic (Ctrl+I)', prefix: '*', suffix: '*', placeholder: 'italic text' },
  { icon: UnderlineIcon, title: 'Underline', prefix: '<u>', suffix: '</u>', placeholder: 'underlined text' },
  { icon: StrikeIcon, title: 'Strikethrough', prefix: '~~', suffix: '~~', placeholder: 'strikethrough' },
];

const insertTools = [
  { icon: LinkIcon, title: 'Link', prefix: '[', suffix: '](url)', placeholder: 'link text' },
];

const listTools = [
  { icon: BulletListIcon, title: 'Bullet list', prefix: '- ', suffix: '', placeholder: 'list item', block: true },
  { icon: NumberListIcon, title: 'Numbered list', prefix: '1. ', suffix: '', placeholder: 'list item', block: true },
  { icon: ChecklistIcon, title: 'Checklist', prefix: '- [ ] ', suffix: '', placeholder: 'task item', block: true },
];

const blockTools = [
  { icon: CodeIcon, title: 'Inline code', prefix: '`', suffix: '`', placeholder: 'code' },
  { icon: CodeBlockIcon, title: 'Code block', prefix: '```\n', suffix: '\n```', placeholder: 'code', block: true },
  { icon: QuoteIcon, title: 'Blockquote', prefix: '> ', suffix: '', placeholder: 'quote', block: true },
  { icon: TableIcon, title: 'Table', prefix: '| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| ', suffix: ' | data | data |', placeholder: 'data', block: true },
  { icon: HrIcon, title: 'Horizontal rule', prefix: '\n---\n', suffix: '', placeholder: '', block: true },
];

export default function MarkdownToolbar({ textareaRef, value, onChange }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [headingOpen, setHeadingOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const applyFormat = (tool) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    let insert;
    if (tool.block && start > 0 && before[before.length - 1] !== '\n') {
      insert = '\n' + tool.prefix + (selected || tool.placeholder) + tool.suffix;
    } else {
      insert = tool.prefix + (selected || tool.placeholder) + tool.suffix;
    }

    const newValue = before + insert + after;
    onChange(newValue);

    requestAnimationFrame(() => {
      ta.focus();
      const offset = tool.block && start > 0 && before[before.length - 1] !== '\n' ? 1 : 0;
      const cursorStart = before.length + offset + tool.prefix.length;
      const cursorEnd = cursorStart + (selected || tool.placeholder).length;
      ta.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const applyHeading = (h) => {
    if (h.prefix) applyFormat(h);
    setHeadingOpen(false);
  };

  const noFocusSteal = (e) => e.preventDefault();

  const btnClass = `w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
    isDark
      ? 'text-dark-muted hover:bg-dark-surface3 hover:text-dark-text'
      : 'text-light-muted hover:bg-light-surface3 hover:text-light-text'
  }`;

  const divider = <div className={`w-px h-5 mx-0.5 ${isDark ? 'bg-dark-border2' : 'bg-light-border2'}`} />;

  return (
    <div className={`flex items-center gap-0.5 px-2 py-1 border-b ${
      isDark ? 'bg-dark-bg2 border-dark-border2' : 'bg-light-bg2 border-light-border2'
    }`}>
      {/* Heading dropdown */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={noFocusSteal}
          onClick={() => setHeadingOpen(!headingOpen)}
          className={`h-8 px-2.5 flex items-center gap-1 rounded-md text-xs font-medium transition-colors ${
            isDark
              ? 'text-dark-muted hover:bg-dark-surface3 hover:text-dark-text'
              : 'text-light-muted hover:bg-light-surface3 hover:text-light-text'
          }`}
        >
          Style
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
        </button>
        {headingOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setHeadingOpen(false)} />
            <div className={`absolute top-full left-0 mt-1 z-20 w-44 rounded-lg border shadow-xl py-1 ${
              isDark ? 'bg-dark-surface border-dark-border2' : 'bg-light-surface border-light-border2'
            }`}>
              {headingOptions.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={noFocusSteal}
                  onClick={() => applyHeading(h)}
                  className={`w-full text-left px-3 py-2 transition-colors ${
                    isDark ? 'hover:bg-dark-surface2 text-dark-text' : 'hover:bg-light-surface2 text-light-text'
                  }`}
                  style={{ fontSize: i === 0 ? 13 : Math.max(13, 22 - i * 3), fontWeight: i === 0 ? 400 : 700, fontFamily: i > 0 ? "'Space Grotesk', sans-serif" : 'inherit' }}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {divider}

      {inlineTools.map((tool, i) => (
        <button key={i} type="button" title={tool.title} onMouseDown={noFocusSteal} onClick={() => applyFormat(tool)} className={btnClass}>
          <tool.icon />
        </button>
      ))}

      {divider}

      {/* Link — plain insert */}
      {(() => { const LinkTool = insertTools[0]; const Icon = LinkTool.icon; return (
        <button type="button" title={LinkTool.title} onMouseDown={noFocusSteal} onClick={() => applyFormat(LinkTool)} className={btnClass}>
          <Icon />
        </button>
      ); })()}
      {/* Image — opens dialog */}
      <button type="button" title="Insert image" onMouseDown={noFocusSteal} onClick={() => setImageDialogOpen(true)} className={btnClass}>
        <ImageIcon />
      </button>
      {imageDialogOpen && (
        <ImageInsertDialog
          onInsert={(md) => {
            const ta = textareaRef.current;
            const start = ta ? ta.selectionStart : value.length;
            const before = value.substring(0, start);
            const after = value.substring(start);
            const newVal = before + (before.length > 0 && before[before.length - 1] !== '\n' ? '\n' : '') + md + '\n' + after;
            onChange(newVal);
            setImageDialogOpen(false);
            requestAnimationFrame(() => { if (ta) { ta.focus(); ta.setSelectionRange(newVal.length, newVal.length); } });
          }}
          onClose={() => setImageDialogOpen(false)}
        />
      )}

      {divider}

      {listTools.map((tool, i) => (
        <button key={i} type="button" title={tool.title} onMouseDown={noFocusSteal} onClick={() => applyFormat(tool)} className={btnClass}>
          <tool.icon />
        </button>
      ))}

      {divider}

      {blockTools.map((tool, i) => (
        <button key={i} type="button" title={tool.title} onMouseDown={noFocusSteal} onClick={() => applyFormat(tool)} className={btnClass}>
          <tool.icon />
        </button>
      ))}
    </div>
  );
}
