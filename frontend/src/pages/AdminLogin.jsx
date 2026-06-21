import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-sm bg-dark-surface border border-dark-border rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="font-heading text-xl font-bold text-dark-text">Admin Login</h1>
          <p className="text-sm text-dark-muted mt-1">Game Guide Wikie!!!</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger-bg border border-danger/30 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-dark-muted">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border bg-dark-surface2 border-dark-border2 text-dark-text text-sm outline-none focus:border-brand" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-dark-muted">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border bg-dark-surface2 border-dark-border2 text-dark-text text-sm outline-none focus:border-brand" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a href="/" className="text-xs text-brand hover:text-brand-dim">← Back to main app</a>
        </div>
      </div>
    </div>
  );
}
