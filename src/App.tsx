import { useState } from 'react';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { Dashboard } from './components/Dashboard';
import { TrackerTable } from './components/TrackerTable';
import { AddEntryForm } from './components/AddEntryForm';
import { Share2, Lock, Unlock, RefreshCw, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('tracker-auth') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const { isLoading, syncError, refresh } = useTracker();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin';
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('tracker-auth', 'true');
      setShowLoginModal(false);
      setPasswordInput('');
      toast.success('Unlocked Admin Mode');
    } else {
      toast.error('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('tracker-auth');
    toast.success('Locked Read-Only Mode');
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    // Strip any query params if they copy the link to share with clients
    url.search = '';
    navigator.clipboard.writeText(url.toString());
    toast.success('Shareable read-only link copied!');
  };

  const handleRefresh = async () => {
    await refresh();
    toast.success('Data refreshed');
  };

  return (
    <div className="app-container">
      <Toaster position="bottom-right" />
      
      {/* Sidebar / Header */}
      <div style={{ width: '100%', backgroundColor: 'var(--color-primary)', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/icon.png" alt="Admanics Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Client Reporting Tracker</h1>
          {!isAuthenticated && <span className="badge badge-pending" style={{ marginLeft: '1rem' }}>Read-Only</span>}
          {isAuthenticated && <span className="badge badge-live" style={{ marginLeft: '1rem' }}>Admin Mode</span>}
          {isLoading && <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginLeft: '0.5rem' }}>Syncing...</span>}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isAuthenticated && (
            <button className="btn" style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} onClick={handleRefresh} title="Refresh Data">
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          )}

          {isAuthenticated ? (
            <button className="btn" style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} onClick={handleLogout} title="Lock App">
              <Unlock size={18} />
            </button>
          ) : (
            <button className="btn" style={{ backgroundColor: 'transparent', color: 'white', border: 'none' }} onClick={() => setShowLoginModal(true)} title="Admin Login">
              <Lock size={18} />
            </button>
          )}
          
          {isAuthenticated && (
            <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-accent)' }} onClick={handleShare}>
              <Share2 size={18} />
              Share View
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {syncError && isAuthenticated && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong>Sync Error:</strong> {syncError}
              </div>
            </div>
          )}

          <Dashboard />
          
          {isAuthenticated && (
            <div style={{ marginBottom: '2rem' }}>
              <AddEntryForm />
            </div>
          )}

          <TrackerTable isReadOnly={!isAuthenticated} />

        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
            <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-text-muted)' }}>
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Lock size={24} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Admin Login</h2>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Enter the password to unlock Add/Edit capabilities.
            </p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Password" 
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <TrackerProvider>
      <AppContent />
    </TrackerProvider>
  );
}

export default App;
