import AdminCrudPage from './AdminCrudPage';
import { useTheme } from '../../contexts/ThemeContext';

export default function AdminCategories() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <AdminCrudPage
      title="Categories"
      icon="🏷️"
      apiBase="/api/admin/categories"
      fields={[
        { name: 'name', label: 'Name', placeholder: 'Category name' },
        { name: 'color_bg', label: 'BG Color', placeholder: '#E6F1FB', type: 'color' },
        { name: 'color_text', label: 'Text Color', placeholder: '#0C447C', type: 'color' },
      ]}
      renderItem={item => (
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full" style={{ background: item.color_text }} />
          <span className={`text-sm font-medium ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{item.name}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: item.color_bg, color: item.color_text }}>{item.color_text}</span>
        </div>
      )}
    />
  );
}
