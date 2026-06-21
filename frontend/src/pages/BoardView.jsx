import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { get, put } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

function KanbanCard({ item, isDark }) {
  const navigate = useNavigate();
  const imgSrc = item.image_url ? `/uploads/${item.image_url}` : '/placeholder.svg';

  return (
    <div
      onClick={() => navigate(`/items/${item.id}`)}
      className={`rounded-lg border p-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-brand/40 ${isDark ? 'bg-dark-surface2 border-dark-border' : 'bg-light-surface border-light-border'}`}
    >
      <img src={imgSrc} alt={item.title} className="w-full h-20 object-cover rounded mb-2" onError={e => { e.target.src = '/placeholder.svg'; }} />
      <h4 className={`text-sm font-semibold line-clamp-1 mb-1 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{item.title}</h4>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-bg text-brand">{item.category}</span>
    </div>
  );
}

function KanbanColumn({ status, items, isDark, onDrop }) {
  const colorMap = {
    'Wishlist': { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
    'Playing': { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
    'Completed': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' },
    'Dropped': { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
    'On Hold': { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' },
  };
  const colors = colorMap[status.name] || { bg: 'bg-brand-bg', text: 'text-brand', border: 'border-brand/30' };

  return (
    <div
      className={`flex-1 min-w-[260px] max-w-[340px] rounded-xl border p-3 ${isDark ? 'bg-dark-bg2 border-dark-border' : 'bg-light-bg2 border-light-border'}`}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        const itemId = e.dataTransfer.getData('itemId');
        if (itemId) onDrop(parseInt(itemId), status.name);
      }}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${colors.bg} ${colors.text} ${colors.border} border`}>
          {status.name}
        </span>
        <span className={`text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            draggable
            onDragStart={e => e.dataTransfer.setData('itemId', item.id.toString())}
          >
            <KanbanCard item={item} isDark={isDark} />
          </div>
        ))}
        {items.length === 0 && (
          <div className={`text-center py-8 text-xs ${isDark ? 'text-dark-hint' : 'text-light-hint'}`}>Drop items here</div>
        )}
      </div>
    </div>
  );
}

export default function BoardView() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [unassigned, setUnassigned] = useState([]);

  useEffect(() => {
    Promise.all([get('/api/items'), get('/api/statuses')]).then(([itemsData, statusData]) => {
      setItems(itemsData);
      setStatuses(statusData);
      setUnassigned(itemsData.filter(i => !i.status));
    });
  }, []);

  const handleDrop = async (itemId, newStatus) => {
    await put(`/api/items/${itemId}`, { status: newStatus });
    const updated = await get('/api/items');
    setItems(updated);
    setUnassigned(updated.filter(i => !i.status));
    toast.success(`Moved to ${newStatus}`);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="w-10 h-0.5 bg-brand rounded-full mb-3" />
        <h1 className={`font-heading text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Board View</h1>
        <p className={`text-sm ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Drag items between columns to update status</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map(status => (
          <KanbanColumn
            key={status.id}
            status={status}
            items={items.filter(i => i.status === status.name)}
            isDark={isDark}
            onDrop={handleDrop}
          />
        ))}
        {unassigned.length > 0 && (
          <KanbanColumn
            status={{ id: 0, name: 'Unassigned' }}
            items={unassigned}
            isDark={isDark}
            onDrop={handleDrop}
          />
        )}
      </div>
    </div>
  );
}
