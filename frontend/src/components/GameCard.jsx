import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function GameCard({ item, onEdit, onDelete, onToggleFav }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const imgSrc = item.image_url ? `/uploads/${item.image_url}` : '/placeholder.svg';

  return (
    <div className={`
      group rounded-xl overflow-hidden border transition-all duration-200
      hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/10 hover:border-brand/40
      ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}
    `}>
      <div
        className="relative aspect-video cursor-pointer overflow-hidden"
        onClick={() => navigate(`/items/${item.id}`)}
      >
        <img
          src={imgSrc}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => { e.target.src = '/placeholder.svg'; }}
        />
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(item.id, item.favorite); }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
            ${item.favorite
              ? 'bg-brand text-white shadow-lg'
              : isDark ? 'bg-dark-surface/80 text-dark-muted hover:text-brand' : 'bg-light-surface/80 text-light-muted hover:text-brand'
            }
          `}
        >
          {item.favorite ? '★' : '☆'}
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{
            background: `${item._catColor || '#f97316'}20`,
            color: item._catColor || '#f97316',
            border: `1px solid ${item._catColor || '#f97316'}40`
          }}>
            {item.category}
          </span>
          {item.status && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${isDark ? 'bg-dark-surface2 text-dark-muted' : 'bg-light-surface2 text-light-muted'}`}>
              {item.status}
            </span>
          )}
        </div>

        <h3
          className={`font-heading font-bold text-[15px] mb-1.5 line-clamp-1 cursor-pointer hover:text-brand transition-colors ${isDark ? 'text-dark-text' : 'text-light-text'}`}
          onClick={() => navigate(`/items/${item.id}`)}
        >
          {item.title}
        </h3>

        <p className={`text-[12.5px] leading-relaxed mb-2 line-clamp-2 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>
          {item.notes || <em className="opacity-40">No notes yet.</em>}
        </p>

        {item.notes && (
          <button
            onClick={() => navigate(`/items/${item.id}`)}
            className="text-xs font-medium text-brand hover:text-brand-dim transition-colors mb-2"
          >
            Read more →
          </button>
        )}

        <div className={`text-[11px] mb-3 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
          Added {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </div>

        <div className={`flex gap-1.5 pt-3 border-t ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <button
            onClick={() => onEdit(item)}
            className={`text-[11px] px-3 py-1.5 rounded-md border transition-colors ${isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2 hover:text-dark-text' : 'border-light-border2 text-light-muted hover:bg-light-surface2 hover:text-light-text'}`}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-[11px] px-3 py-1.5 rounded-md border border-danger/25 text-danger hover:bg-danger-bg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
