import AdminCrudPage from './AdminCrudPage';
import { useTheme } from '../../contexts/ThemeContext';

export default function AdminStatuses() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <AdminCrudPage
      title="Statuses"
      icon="📋"
      apiBase="/api/admin/statuses"
      fields={[
        { name: 'name', label: 'Name', placeholder: 'Status name' },
        { name: 'color_bg', label: 'BG Color', placeholder: '#E6F1FB', type: 'color' },
        { name: 'color_text', label: 'Text Color', placeholder: '#0C447C', type: 'color' },
      ]}
      renderItem={item => (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: item.color_bg, color: item.color_text }}>{item.name}</span>
        </div>
      )}
    />
  );
}
