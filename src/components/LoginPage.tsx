import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClients } from '../context/ClientsContext';
import { Lock, Users, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

type Mode = 'admin' | 'client';

export const LoginPage: React.FC = () => {
  const { loginAdmin, loginClient } = useAuth();
  const { clients } = useClients();
  const [mode, setMode] = useState<Mode>('admin');
  const [password, setPassword] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Only clients WITH a password set can appear in the dropdown
  const loginableClients = clients.filter(c => !!c.password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => { // slight delay for UX feel
      let ok = false;
      if (mode === 'admin') {
        ok = loginAdmin(password);
        if (!ok) setError('Incorrect admin password');
      } else {
        if (!selectedClientId) { setError('Please select your company'); setLoading(false); return; }
        ok = loginClient(selectedClientId, password);
        if (!ok) setError('Incorrect password');
      }
      if (ok) toast.success(mode === 'admin' ? 'Logged in as Admin' : 'Welcome!');
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e1b4b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/icon.png" alt="Admanics" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 12, marginBottom: '1rem', boxShadow: '0 0 0 4px rgba(255,255,255,0.08)' }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>Client Reporting Tracker</h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.35rem' }}>Powered by Admanics</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: '1.75rem' }}>
            {(['admin', 'client'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setPassword(''); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
                  backgroundColor: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  boxShadow: mode === m ? 'var(--shadow-sm)' : 'none' }}>
                {m === 'admin' ? <Shield size={14} /> : <Users size={14} />}
                {m === 'admin' ? 'Admin' : 'Client Access'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Client select (client mode only) */}
            {mode === 'client' && (
              <div className="form-group">
                <label className="form-label">Company</label>
                {loginableClients.length === 0 ? (
                  <div style={{ padding: '0.75rem', backgroundColor: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, fontSize: '0.82rem', color: '#713f12' }}>
                    No client accounts set up yet. Ask your admin to add a password to your client profile.
                  </div>
                ) : (
                  <select className="form-input" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                    <option value="">— Select your company —</option>
                    {loginableClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Password */}
            <div className="form-group">
              <label className="form-label">{mode === 'admin' ? 'Admin Password' : 'Password'}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                <input type="password" className="form-input" placeholder="Enter password" value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  style={{ paddingLeft: '2.5rem' }} autoFocus />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.82rem', color: '#991b1b', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.9rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Checking…' : mode === 'admin' ? 'Login as Admin' : 'Access My Dashboard'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', marginTop: '1.5rem' }}>
          © {new Date().getFullYear()} Admanics. All rights reserved.
        </p>
      </div>
    </div>
  );
};
