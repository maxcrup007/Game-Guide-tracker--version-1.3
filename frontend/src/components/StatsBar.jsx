import { useTheme } from '../contexts/ThemeContext';

export default function StatsBar({ total, categories, favorites }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const cardClass = `rounded-xl border p-4 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className={cardClass}>
        <div className={`text-xs font-medium mb-1 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Total Items</div>
        <div className={`text-2xl font-heading font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{total}</div>
      </div>
      <div className={cardClass}>
        <div className={`text-xs font-medium mb-1 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Categories</div>
        <div className={`text-2xl font-heading font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{categories}</div>
      </div>
      <div className={cardClass}>
        <div className={`text-xs font-medium mb-1 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Favorites</div>
        <div className="text-2xl font-heading font-bold text-brand">{favorites}</div>
      </div>
    </div>
  );
}
