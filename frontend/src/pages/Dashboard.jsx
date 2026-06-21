import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { get, post, put, del } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import GameCard from '../components/GameCard';
import StatsBar from '../components/StatsBar';
import SearchFilter from '../components/SearchFilter';
import ItemModal from '../components/ItemModal';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { selectedCategory, showFavorites } = useOutletContext();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('new');
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
  }, [search, sort, selectedCategory, showFavorites]);

  useEffect(() => {
    loadItems();
    get('/api/statuses').then(setStatuses).catch(() => {});
    get('/api/announcements').then(setAnnouncements).catch(() => {});
  }, [loadItems]);

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
      {announcements.map(a => (
        <div key={a.id} className="mb-4 rounded-lg border border-brand/25 bg-brand-bg p-3 flex gap-3 text-sm">
          <span>📢</span>
          <div>
            <div className="font-semibold text-brand">{a.title}</div>
            {a.body && <div className={`text-xs mt-0.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{a.body}</div>}
          </div>
        </div>
      ))}

      <div className="mb-6">
        <div className="w-10 h-0.5 bg-brand rounded-full mb-3" />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={`font-heading text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>My Collection</h1>
            <p className={`text-sm ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Track every game and hobby you love</p>
          </div>
          <button
            onClick={() => { setEditingItem(null); setModalOpen(true); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors"
          >
            + Add Item
          </button>
        </div>
      </div>

      <StatsBar {...stats} />
      <SearchFilter search={search} onSearchChange={setSearch} sort={sort} onSortChange={setSort} />

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-40">🎮</div>
          <p className={isDark ? 'text-dark-hint' : 'text-light-hint'}>No items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <GameCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} onToggleFav={handleToggleFav} />
          ))}
        </div>
      )}

      <ItemModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        item={editingItem}
        categories={categories}
        statuses={statuses}
      />
    </div>
  );
}
