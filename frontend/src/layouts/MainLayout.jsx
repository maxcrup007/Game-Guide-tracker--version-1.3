import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          showFavorites={showFavorites}
          onToggleFavorites={() => setShowFavorites(f => !f)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet context={{ selectedCategory, showFavorites, setSelectedCategory, setShowFavorites }} />
        </main>
      </div>
    </div>
  );
}
