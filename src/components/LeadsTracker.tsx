import { useState } from 'react';
import { LeadsTable } from './LeadsTable';
import { AddLeadForm } from './AddLeadForm';
import { Modal } from './Modal';
import { Plus, RefreshCw } from 'lucide-react';
import { useLeads } from '../context/LeadsContext';
import { toast } from 'react-hot-toast';

interface LeadsTrackerProps {
  isReadOnly?: boolean;
}

export const LeadsTracker: React.FC<LeadsTrackerProps> = ({ isReadOnly }) => {
  const { isLoading, refresh } = useLeads();
  const [showAddLead, setShowAddLead] = useState(false);

  const handleRefresh = async () => {
    await refresh();
    toast.success('Leads refreshed');
  };

  return (
    <>
      <div className="page-topbar">
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
            {isReadOnly ? 'Daily Leads' : 'Daily Leads Tracker'}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
            {isReadOnly ? 'Read-only log of daily lead counts' : 'Log and track leads generated daily by client campaigns'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={handleRefresh} title="Refresh" style={{ padding: '0.4rem 0.75rem' }}>
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {!isReadOnly && (
            <button className="btn btn-primary" onClick={() => setShowAddLead(true)} style={{ padding: '0.4rem 0.9rem' }}>
              <Plus size={15} />Add Lead Entry
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <LeadsTable isReadOnly={isReadOnly} />
      </div>

      <Modal isOpen={showAddLead} onClose={() => setShowAddLead(false)} title="Add New Daily Lead Entry" maxWidth="640px">
        <AddLeadForm onClose={() => setShowAddLead(false)} />
      </Modal>
    </>
  );
};
