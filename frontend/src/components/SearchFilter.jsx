import { useTheme } from '../contexts/ThemeContext';

export default function SearchFilter({ search, onSearchChange, sort, onSortChange }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const inputClass = `px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-brand ${isDark ? 'bg-dark-surface border-dark-border2 text-dark-text placeholder:text-dark-hint' : 'bg-light-surface border-light-border2 text-light-text placeholder:text-light-hint'}`;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <input
        type="text"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search title or notes..."
        className={`flex-1 min-w-[200px] ${inputClass}`}
      />
      <select value={sort} onChange={e => onSortChange(e.target.value)} className={inputClass}>
        <option value="new">Newest first</option>
        <option value="old">Oldest first</option>
        <option value="az">A → Z</option>
      </select>
    </div>
  );
}
