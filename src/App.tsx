import { useState } from 'react';
import { TrackerProvider } from './context/TrackerContext';
import { ClientsProvider, useClients } from './context/ClientsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import type { AppView } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TrackerTable } from './components/TrackerTable';
import { AddEntryForm } from './components/AddEntryForm';
import { AddCalendarEntry } from './components/AddCalendarEntry';
import { AddClientForm } from './components/AddClientForm';
import { ClientList } from './components/ClientList';
import { ClientCalendar } from './components/ClientCalendar';
import { Modal } from './components/Modal';
import { useTracker } from './context/TrackerContext';
import { Plus, Share2, RefreshCw } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// ── Page topbar ────────────────────────────────────────────────────────────
const TrackerTopbar: React.FC = () => {
  const { isLoading, refresh } = useTracker();
  const { auth } = useAuth();
  const [showAddEntry, setShowAddEntry] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  const handleRefresh = async () => { await refresh(); toast.success('Refreshed'); };

  return (
    <>
      <div className="page-topbar">
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            {auth?.role === 'client' ? 'Live Tracker' : 'Main Tracker'}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {auth?.role === 'client' ? 'Read-only view of live entries' : 'All client reporting entries'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          {auth?.role === 'superadmin' && (
            <>
              <button className="btn btn-secondary" onClick={handleRefresh} title="Refresh" style={{ padding: '0.4rem 0.75rem' }}>
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button className="btn btn-secondary" onClick={handleShare} style={{ padding: '0.4rem 0.75rem' }}>
                <Share2 size={15} />Share
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddEntry(true)} style={{ padding: '0.4rem 0.9rem' }}>
                <Plus size={15} />Add Entry
              </button>
            </>
          )}
        </div>
      </div>
      <Modal isOpen={showAddEntry} onClose={() => setShowAddEntry(false)} title="Add New Entry" maxWidth="720px">
        <AddEntryForm onClose={() => setShowAddEntry(false)} />
      </Modal>
    </>
  );
};

// ── App shell ──────────────────────────────────────────────────────────────
const AppShell: React.FC = () => {
  const { auth } = useAuth();
  const { clients } = useClients();

  // Default view based on role
  const [view, setView] = useState<AppView>(() => {
    if (auth?.role === 'client' && auth.clientId) {
      return { page: 'calendar', clientId: auth.clientId };
    }
    return { page: 'tracker' };
  });

  // Clients can see tracker (read-only) and their own calendar only.
  // Guard: if a client somehow lands on another client's calendar, redirect.
  const effectiveView: AppView = (() => {
    if (auth?.role === 'client' && auth.clientId) {
      if (view.page === 'clients') return { page: 'calendar', clientId: auth.clientId };
      if (view.page === 'calendar' && (view as { page: 'calendar'; clientId: string }).clientId !== auth.clientId) {
        return { page: 'calendar', clientId: auth.clientId };
      }
    }
    return view;
  })();

  const activeClient = effectiveView.page === 'calendar'
    ? clients.find(c => c.id === (effectiveView as { page: 'calendar'; clientId: string }).clientId) ?? null
    : null;

  const isSuperAdmin = auth?.role === 'superadmin';

  // Modals managed at app level
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Toaster position="bottom-right" />

      {/* Sidebar */}
      <Sidebar view={effectiveView} onNavigate={setView} />

      {/* Main area */}
      <main className="app-main">

        {/* ── Main Tracker ── */}
        {effectiveView.page === 'tracker' && (
          <>
            <TrackerTopbar />
            <div className="page-body">
              <Dashboard />
              <div style={{ marginTop: '2rem' }}>
                <TrackerTable isReadOnly={!isSuperAdmin} />
              </div>
            </div>
          </>
        )}

        {/* ── Client List ── */}
        {effectiveView.page === 'clients' && (
          <>
            <div className="page-topbar">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>Clients</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
              </div>
              {isSuperAdmin && (
                <button className="btn btn-primary" onClick={() => setShowAddClient(true)} style={{ padding: '0.4rem 0.9rem' }}>
                  <Plus size={15} />Add Client
                </button>
              )}
            </div>
            <div className="page-body">
              <ClientList isReadOnly={!isSuperAdmin} onSelectClient={id => setView({ page: 'calendar', clientId: id })} />
            </div>
            <Modal isOpen={showAddClient} onClose={() => setShowAddClient(false)} title="Add New Client">
              <AddClientForm onClose={() => setShowAddClient(false)} />
            </Modal>
          </>
        )}

        {/* ── Client Calendar ── */}
        {effectiveView.page === 'calendar' && activeClient && (
          <>
            <div className="page-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: activeClient.color, flexShrink: 0, display: 'inline-block' }} />
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{activeClient.name}</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{activeClient.pilotLabel}</p>
                </div>
              </div>
              {isSuperAdmin && (
                <button className="btn btn-primary" onClick={() => setShowAddTask(true)} style={{ padding: '0.4rem 0.9rem' }}>
                  <Plus size={15} />Add Task
                </button>
              )}
            </div>
            <div className="page-body">
              <ClientCalendar client={activeClient} isReadOnly={!isSuperAdmin} />
            </div>
            <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title={`Add Task — ${activeClient.name}`} maxWidth="640px">
              <AddCalendarEntry clientId={activeClient.id} onClose={() => setShowAddTask(false)} />
            </Modal>
          </>
        )}

        {/* Edge case: calendar view but client not found */}
        {effectiveView.page === 'calendar' && !activeClient && (
          <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Client not found.</p>
          </div>
        )}

      </main>
    </div>
  );
};

// ── Root ───────────────────────────────────────────────────────────────────
const AppRoot: React.FC = () => {
  const { auth } = useAuth();
  if (!auth) return <LoginPage />;
  return <AppShell />;
};

function App() {
  return (
    <TrackerProvider>
      <ClientsProvider>
        <AuthProvider>
          <AppRoot />
        </AuthProvider>
      </ClientsProvider>
    </TrackerProvider>
  );
}

export default App;
