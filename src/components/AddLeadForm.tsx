import { useState } from 'react';
import { useLeads } from '../context/LeadsContext';
import { useClients } from '../context/ClientsContext';
import { Plus } from 'lucide-react';

interface Props {
  onClose?: () => void;
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

export const AddLeadForm: React.FC<Props> = ({ onClose }) => {
  const { addLead } = useLeads();
  const { clients } = useClients();
  const [clientId, setClientId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [leads, setLeads] = useState<number>(0);
  const [source, setSource] = useState<string>('Google Ads');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !source) return;

    const selectedClient = clients.find(c => c.id === clientId);
    const customUrl = selectedClient?.googleSheetUrl;

    await addLead({ clientId, date, leads, source, notes }, customUrl);
    
    // Reset form
    setClientId('');
    setDate(new Date().toISOString().split('T')[0]);
    setLeads(0);
    setSource('Google Ads');
    setNotes('');
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Client</label>
          <select 
            className="form-input" 
            value={clientId} 
            onChange={e => setClientId(e.target.value)}
            required
          >
            <option value="">-- Select Client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input 
            type="date" 
            className="form-input" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Leads Generated</label>
          <input 
            type="number" 
            className="form-input" 
            value={leads} 
            onChange={e => setLeads(Math.max(0, parseInt(e.target.value) || 0))} 
            min={0}
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lead Source</label>
          <select 
            className="form-input" 
            value={source} 
            onChange={e => setSource(e.target.value)}
            required
          >
            {SOURCES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '0.5rem' }}>
        <label className="form-label">Notes</label>
        <textarea 
          className="form-input" 
          rows={3} 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          placeholder="Add details, campaign info, etc..." 
          style={{ resize: 'vertical' }} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        {onClose && <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>}
        <button type="submit" className="btn btn-primary" disabled={!clientId}>
          <Plus size={16} />Add Lead Entry
        </button>
      </div>
    </form>
  );
};
