import { createContext, useContext, useState, useEffect } from 'react';
import { get, post } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/admin/me')
      .then(data => {
        if (data.username) {
          setIsAdmin(true);
          setAdminUsername(data.username);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await post('/admin/login', { username, password });
    if (res.success) {
      setIsAdmin(true);
      setAdminUsername(username);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = async () => {
    await post('/admin/logout', {});
    setIsAdmin(false);
    setAdminUsername('');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, adminUsername, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
