import AdminCrudPage from './AdminCrudPage';

export default function AdminTags() {
  return (
    <AdminCrudPage
      title="Tags"
      icon="🔖"
      apiBase="/api/admin/tags"
      fields={[{ name: 'name', label: 'Name', placeholder: 'Tag name' }]}
    />
  );
}
