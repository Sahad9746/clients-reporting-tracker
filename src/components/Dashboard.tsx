import { useTracker } from '../context/TrackerContext';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Radio, Clock, CheckCircle2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { entries } = useTracker();
  const { auth } = useAuth();

  const clientEntries = auth?.role === 'client' && auth.clientId
    ? entries.filter(e => e.clientId === auth.clientId)
    : entries;

  const totalTasks = clientEntries.length;
  const liveItems = clientEntries.filter(e => e.status === 'Live').length;
  const pendingItems = clientEntries.filter(e => e.status === 'Pending').length;
  const completedItems = clientEntries.filter(e => e.status === 'Completed').length;

  if (totalTasks === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      {totalTasks > 0 && (
        <div className="card animate-fade-in" style={{ animationDelay: '0s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '12px', color: '#3730a3' }}>
              <ClipboardList size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Tasks</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalTasks}</p>
            </div>
          </div>
        </div>
      )}

      {liveItems > 0 && (
        <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-status-live-bg)', borderRadius: '12px', color: 'var(--color-status-live-text)' }}>
              <Radio size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Live Items</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{liveItems}</p>
            </div>
          </div>
        </div>
      )}

      {pendingItems > 0 && (
        <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-status-pending-bg)', borderRadius: '12px', color: 'var(--color-status-pending-text)' }}>
              <Clock size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Pending</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{pendingItems}</p>
            </div>
          </div>
        </div>
      )}

      {completedItems > 0 && (
        <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-status-completed-bg)', borderRadius: '12px', color: 'var(--color-status-completed-text)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Completed</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{completedItems}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
