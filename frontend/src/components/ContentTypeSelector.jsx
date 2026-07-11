import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const CONTENT_TYPES = [
  {
    value: 'markdown',
    label: 'Markdown',
    ext: '.md',
    icon: '⬇️',
    desc: 'Formatted text with headings, lists, images, tables',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    mono: true,
    toolbar: true,
  },
  {
    value: 'text',
    label: 'Plain Text',
    ext: '.txt',
    icon: '📄',
    desc: 'Simple unformatted text',
    badge: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    mono: false,
    toolbar: false,
  },
  {
    value: 'html',
    label: 'HTML',
    ext: '.html',
    icon: '🌐',
    desc: 'Raw HTML with full styling support',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    mono: true,
    toolbar: false,
  },
  {
    value: 'json',
    label: 'JSON',
    ext: '.json',
    icon: '{ }',
    desc: 'Structured JSON data with syntax highlighting',
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    mono: true,
    toolbar: false,
  },
];

export default function ContentTypeSelector({ value, onChange }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const current = CONTENT_TYPES.find(t => t.value === value) || CONTENT_TYPES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`h-8 flex items-center gap-2 px-2.5 rounded-lg border text-xs font-medium transition-colors ${
          isDark
            ? 'bg-dark-bg border-dark-border2 text-dark-text hover:border-dark-muted'
            : 'bg-white border-light-border2 text-light-text hover:border-light-muted'
        }`}
      >
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${current.badge}`}>{current.ext}</span>
        <span>{current.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-dark-hint' : 'text-light-hint'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute top-full left-0 mt-1.5 z-20 w-64 rounded-xl border shadow-xl overflow-hidden ${
            isDark ? 'bg-dark-surface border-dark-border2' : 'bg-white border-light-border2'
          }`}>
            <div className={`px-3 py-2 border-b text-[10px] font-semibold uppercase tracking-wider ${
              isDark ? 'border-dark-border text-dark-hint' : 'border-light-border text-light-hint'
            }`}>
              Content Format
            </div>
            {CONTENT_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => { onChange(type.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors ${
                  value === type.value
                    ? isDark ? 'bg-dark-surface2' : 'bg-light-surface2'
                    : isDark ? 'hover:bg-dark-surface2' : 'hover:bg-light-surface2'
                }`}
              >
                <span className={`mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${type.badge}`}>{type.ext}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{type.label}</span>
                    {value === type.value && <span className="text-[10px] text-brand font-semibold">Active</span>}
                  </div>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>{type.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
