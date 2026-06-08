import { useState } from 'react';
import { useLeads } from '../context/LeadsContext';
import { useClients } from '../context/ClientsContext';
import { useAuth } from '../context/AuthContext';
import { Download, Search, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import type { DailyLead } from '../types';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { EditLeadModal } from './EditLeadModal';

interface LeadsTableProps {
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

export const LeadsTable: React.FC<LeadsTableProps> = ({ isReadOnly }) => {
  const { dailyLeads, deleteLead, updateLead } = useLeads();
  const { clients } = useClients();
  const { auth } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<DailyLead | null>(null);

  const filteredLeads = dailyLeads.filter(lead => {
    const clientName = clients.find(c => c.id === lead.clientId)?.name || '';
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      lead.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.source.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
    const matchesClient = isReadOnly 
      ? lead.clientId === auth?.clientId 
      : clientFilter === 'All' || lead.clientId === clientFilter;
      
    return matchesSearch && matchesSource && matchesClient;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Client', 'Source', 'Leads Generated', 'Notes', 'Last Updated'];
    const csvRows = [headers.join(',')];

    for (const lead of filteredLeads) {
      const clientName = clients.find(c => c.id === lead.clientId)?.name || '';
      const row = [
        lead.date,
        `"${clientName.replace(/"/g, '""')}"`,
        `"${lead.source.replace(/"/g, '""')}"`,
        lead.leads,
        `"${lead.notes.replace(/"/g, '""')}"`,
        lead.lastUpdated
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (leadToDelete) {
      const lead = dailyLeads.find(l => l.id === leadToDelete);
      const selectedClient = clients.find(c => c.id === lead?.clientId);
      const customUrl = selectedClient?.googleSheetUrl;

      await deleteLead(leadToDelete, customUrl);
      setLeadToDelete(null);
    }
  };

  const handleSaveEdit = async (id: string, updated: Partial<DailyLead>) => {
    const selectedClient = clients.find(c => c.id === updated.clientId);
    const customUrl = selectedClient?.googleSheetUrl;
    await updateLead(id, updated, customUrl);
  };

  return (
    <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>Daily Leads Log</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search leads..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '200px' }}
            />
          </div>
          
          <select 
            className="form-input" 
            style={{ width: '150px' }}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="All">All Sources</option>
            {SOURCES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {!isReadOnly && (
            <select 
              className="form-input" 
              style={{ width: '160px' }}
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="All">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              {!isReadOnly && <th>Client</th>}
              <th>Source</th>
              <th>Leads Generated</th>
              <th>Notes</th>
              {!isReadOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 4 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No lead entries found.
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => {
                let formattedDate = lead.date;
                try {
                  const d = new Date(lead.date);
                  if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                  }
                } catch(e) {}
                
                return (
                  <tr key={lead.id}>
                    <td>{formattedDate}</td>
                    {!isReadOnly && (
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          {clients.find(c => c.id === lead.clientId)?.name || '—'}
                        </span>
                      </td>
                    )}
                    <td>
                      <span style={{ fontWeight: 500 }}>{lead.source}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: lead.leads > 0 ? '#0284c7' : 'var(--color-text-muted)' }}>
                        {lead.leads}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.notes}>
                      {lead.notes || '—'}
                    </td>
                    {!isReadOnly && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => setLeadToEdit(lead)}
                            style={{ color: 'var(--color-primary)', padding: '0.25rem', borderRadius: '4px' }}
                            title="Edit Lead Record"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => setLeadToDelete(lead.id)}
                            style={{ color: '#ef4444', padding: '0.25rem', borderRadius: '4px' }}
                            title="Delete Lead Record"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {leadToEdit && typeof document !== 'undefined' && createPortal(
        <EditLeadModal 
          lead={leadToEdit}
          onClose={() => setLeadToEdit(null)}
          onSave={handleSaveEdit}
          isReadOnly={isReadOnly}
        />,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {leadToDelete && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '50%', color: '#ef4444' }}>
                <AlertTriangle size={32} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Delete Lead Record</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Are you sure you want to delete this lead record? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setLeadToDelete(null)}>
                Cancel
              </button>
              <button className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }} onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
