import AdminCrudPage from './AdminCrudPage';

export default function AdminPlatforms() {
  return (
    <AdminCrudPage
      title="Platforms"
      icon="🖥️"
      apiBase="/api/admin/platforms"
      fields={[{ name: 'name', label: 'Name', placeholder: 'Platform name' }]}
    />
  );
}
