import { useState, useEffect } from 'react';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { Dashboard } from './components/Dashboard';
import { TrackerTable } from './components/TrackerTable';
import { AddEntryForm } from './components/AddEntryForm';
import { LayoutDashboard, Share2, Settings, FileSpreadsheet, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const AppContent: React.FC = () => {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { syncUrl, setSyncUrl, isLoading, syncError } = useTracker();
  const [tempUrl, setTempUrl] = useState(syncUrl);

  useEffect(() => {
    setTempUrl(syncUrl);
  }, [syncUrl]);

  useEffect(() => {
    // Check if URL has ?view=client
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') {
      setIsReadOnly(true);
    }
  }, []);

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'client');
    navigator.clipboard.writeText(url.toString());
    toast.success('Shareable read-only link copied!');
  };

  return (
    <div className="app-container">
      <Toaster position="bottom-right" />
      
      {/* Sidebar / Header (Top on mobile, side on desktop via CSS, but we'll do a simple top bar for flexibility) */}
      <div style={{ width: '100%', backgroundColor: 'var(--color-primary)', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LayoutDashboard size={24} color="var(--color-accent)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Client Reporting Tracker</h1>
          {isReadOnly && <span className="badge badge-pending" style={{ marginLeft: '1rem' }}>Client View</span>}
          {isLoading && <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginLeft: '0.5rem' }}>Syncing...</span>}
        </div>
        
        {!isReadOnly && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => setShowSettings(true)}>
              <Settings size={18} />
              Settings
            </button>
            <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-accent)' }} onClick={handleShare}>
              <Share2 size={18} />
              Share View
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {syncError && !isReadOnly && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong>Sync Error:</strong> {syncError}
              </div>
              <button onClick={() => setShowSettings(true)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', borderColor: '#ef4444', color: '#b91c1c', backgroundColor: 'transparent' }}>Open Settings</button>
            </div>
          )}

          <Dashboard />
          
          {!isReadOnly && (
            <div style={{ marginBottom: '2rem' }}>
              <AddEntryForm />
            </div>
          )}

          <TrackerTable isReadOnly={isReadOnly} />

        </div>
      </main>

      {/* Settings Modal (Google Sheets Setup Placeholder) */}
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
            <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-text-muted)' }}>
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <FileSpreadsheet size={24} color="#10b981" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Google Sheets Sync</h2>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              To persist this data globally, you can set up a Google Sheets Sync. Currently, data is saved locally in your browser.
            </p>

            <div className="form-group">
              <label className="form-label">Google Apps Script URL / API Endpoint</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://script.google.com/macros/s/.../exec" 
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)}
              />
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong>Setup Instructions:</strong> Create a new Google Sheet, go to Extensions &gt; Apps Script. Paste the provided script (available in the documentation), deploy as a Web App, and paste the URL above.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
              {syncUrl && (
                <button className="btn btn-secondary" onClick={() => {
                  setSyncUrl('');
                  setShowSettings(false);
                  toast.success('Sync disconnected. Data will remain locally.');
                }}>
                  Disconnect
                </button>
              )}
              <button className="btn btn-primary" onClick={() => {
                setSyncUrl(tempUrl);
                setShowSettings(false);
                toast.success('Settings saved!');
              }}>
                Save Settings
              </button>
            </div>
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
