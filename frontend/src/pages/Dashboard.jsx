import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { get, post, put, del } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import GameCard from '../components/GameCard';
import StatsBar from '../components/StatsBar';
import SearchFilter from '../components/SearchFilter';
import ItemModal from '../components/ItemModal';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 12;

export default function Dashboard() {
  const { selectedCategory, showFavorites } = useOutletContext();
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const loadItems = useCallback(async () => {
    const params = new URLSearchParams({ search, sort });
    if (selectedCategory) params.set('category', selectedCategory);
    if (showFavorites) params.set('favorite', 'true');
    const data = await get(`/api/items?${params}`);
    const cats = await get('/api/categories');
    const catMap = {};
    cats.forEach(c => { catMap[c.name] = c.color_text; });
    setItems(data.map(i => ({ ...i, _catColor: catMap[i.category] })));
    setCategories(cats);
    setPage(1);
  }, [search, sort, selectedCategory, showFavorites]);

  useEffect(() => {
    loadItems();
    get('/api/statuses').then(setStatuses).catch(() => {});
    get('/api/announcements').then(setAnnouncements).catch(() => {});
    if (!isAdmin) {
      get('/api/items/recommended').then(data => {
        get('/api/categories').then(cats => {
          const catMap = {};
          cats.forEach(c => { catMap[c.name] = c.color_text; });
          setRecommended(data.map(i => ({ ...i, _catColor: catMap[i.category] })));
        }).catch(() => setRecommended(data));
      }).catch(() => {});
    }
  }, [loadItems, isAdmin]);

  // Pagination
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const pageItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    total: items.length,
    categories: new Set(items.map(i => i.category)).size,
    favorites: items.filter(i => i.favorite).length,
  };

  const handleSave = async (data) => {
    let saved;
    if (editingItem) {
      saved = await put(`/api/items/${editingItem.id}`, data);
      toast.success('Updated!');
    } else {
      saved = await post('/api/items', data);
      toast.success('Added!');
    }
    setEditingItem(null);
    loadItems();
    return saved;
  };

  const handleEdit = (item) => { setEditingItem(item); setModalOpen(true); };
  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await del(`/api/items/${id}`);
    toast.success('Deleted');
    loadItems();
  };
  const handleToggleFav = async (id, current) => {
    await put(`/api/items/${id}`, { favorite: !current });
    loadItems();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Announcements */}
      {announcements.map(a => (
        <div key={a.id} className="mb-4 rounded-lg border border-brand/25 bg-brand-bg p-3 flex gap-3 text-sm">
          <span>📢</span>
          <div>
            <div className="font-semibold text-brand">{a.title}</div>
            {a.body && <div className={`text-xs mt-0.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{a.body}</div>}
          </div>
        </div>
      ))}

      {/* ── Recommended section (regular users only) ── */}
      {!isAdmin && recommended.length > 0 && (
        <div className="mb-8">
          <div className="w-10 h-0.5 bg-brand rounded-full mb-3" />
          <h2 className={`font-heading text-lg font-bold mb-1 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Recommended Information</h2>
          <p className={`text-xs mb-4 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Popular guides and favorites picked for you</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {recommended.map(item => {
              const imgSrc = item.image_url ? `/uploads/${item.image_url}` : '/placeholder.svg';
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/items/${item.id}`)}
                  className={`shrink-0 w-44 rounded-xl border overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-brand/40 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}
                >
                  <img src={imgSrc} alt={item.title} className="w-full h-24 object-cover" onError={e => { e.target.src = '/placeholder.svg'; }} />
                  <div className="p-2.5">
                    <div className="text-[11px] font-semibold mb-1" style={{ color: item._catColor || '#f97316' }}>{item.category}</div>
                    <div className={`text-xs font-semibold line-clamp-2 leading-snug ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{item.title}</div>
                    {item.favorite && <div className="text-[10px] text-brand mt-1">★ Favorite</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Collection header ── */}
      <div className="mb-6">
        <div className="w-10 h-0.5 bg-brand rounded-full mb-3" />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={`font-heading text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>My Collection</h1>
            <p className={`text-sm ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Track every game and hobby you love</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setEditingItem(null); setModalOpen(true); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors"
            >
              + Add Item
            </button>
          )}
        </div>
      </div>

      <StatsBar {...stats} />
      <SearchFilter search={search} onSearchChange={setSearch} sort={sort} onSortChange={setSort} />

      {/* ── Card grid ── */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-40">🎮</div>
          <p className={isDark ? 'text-dark-hint' : 'text-light-hint'}>No items found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map(item => (
              <GameCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} onToggleFav={handleToggleFav} />
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-30 ${
                  isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'
                }`}
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                const show = n === 1 || n === totalPages || Math.abs(n - page) <= 1;
                const showDots = !show && (n === 2 || n === totalPages - 1);
                if (showDots) return <span key={n} className={`px-1 text-sm ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>…</span>;
                if (!show) return null;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === n
                        ? 'bg-brand text-white'
                        : isDark ? 'text-dark-muted hover:bg-dark-surface2 border border-dark-border2' : 'text-light-muted hover:bg-light-surface2 border border-light-border2'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-30 ${
                  isDark ? 'border-dark-border2 text-dark-muted hover:bg-dark-surface2' : 'border-light-border2 text-light-muted hover:bg-light-surface2'
                }`}
              >
                Next →
              </button>
            </div>
          )}

          <p className={`text-center text-xs mt-3 ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, items.length)} of {items.length} items
          </p>
        </>
      )}

      {isAdmin && (
        <ItemModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditingItem(null); }}
          onSave={handleSave}
          item={editingItem}
          categories={categories}
          statuses={statuses}
        />
      )}
    </div>
  );
}
