import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { DailyLead } from '../types';
import { useClients } from '../context/ClientsContext';

interface EditLeadModalProps {
  lead: DailyLead;
  onClose: () => void;
  onSave: (id: string, updated: Partial<DailyLead>) => void;
  isReadOnly?: boolean;
}

const SOURCES = [
  'Google Ads',
  'Meta Ads',
  'LinkedIn Ads',
  'Organic SEO',
  'Email Marketing',
  'Outreach',
  'Referral',
  'Other',
];

export const EditLeadModal: React.FC<EditLeadModalProps> = ({ lead, onClose, onSave, isReadOnly }) => {
  const { clients } = useClients();
  const [formData, setFormData] = useState({
    date: lead.date,
    clientId: lead.clientId,
    leads: lead.leads,
    source: lead.source,
    notes: lead.notes,
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(lead.id, formData);
    onClose();
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div 
        className="card animate-fade-in" 
        style={{ 
          maxWidth: '550px', 
          width: '100%', 
          margin: 'auto',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>
            Edit Daily Lead Entry
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              padding: '0.5rem', 
              borderRadius: '4px',
              color: 'var(--color-text-muted)',
              transition: 'color 0.2s'
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Client</label>
              <select 
                className="form-input" 
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                disabled={isReadOnly}
                required
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Leads Generated</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.leads}
                onChange={(e) => setFormData({ ...formData, leads: Math.max(0, parseInt(e.target.value) || 0) })}
                min={0}
                required
              />
            </div>

            <div>
              <label className="form-label">Lead Source</label>
              <select 
                className="form-input" 
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                required
              >
                {SOURCES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Notes</label>
              <textarea 
                className="form-input" 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
