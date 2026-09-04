import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import ItemDetail from './pages/ItemDetail';
import RequestPage from './pages/RequestPage';
import ContactPage from './pages/ContactPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import AdminTags from './pages/admin/AdminTags';
import AdminPlatforms from './pages/admin/AdminPlatforms';
import AdminStatuses from './pages/admin/AdminStatuses';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminRequests from './pages/admin/AdminRequests';
import AdminEditRequests from './pages/admin/AdminEditRequests';
import AdminSuperusers from './pages/admin/AdminSuperusers';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/board" element={<BoardView />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/request" element={<RequestPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="tags" element={<AdminTags />} />
              <Route path="platforms" element={<AdminPlatforms />} />
              <Route path="statuses" element={<AdminStatuses />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="edit-requests" element={<AdminEditRequests />} />
              <Route path="superusers" element={<AdminSuperusers />} />
            </Route>
          </Routes>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: { background: '#303030', color: '#f0ede8', border: '1px solid rgba(255,255,255,0.13)', borderRadius: '99px', fontSize: '13px' },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
