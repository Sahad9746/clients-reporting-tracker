import { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { useClients } from '../context/ClientsContext';
import { useAuth } from '../context/AuthContext';
import { Download, Search, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import type { Status, TaskType, Entry } from '../types';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { EditEntryModal } from './EditEntryModal';

interface TrackerTableProps {
  isReadOnly?: boolean;
}

export const TrackerTable: React.FC<TrackerTableProps> = ({ isReadOnly }) => {
  const { entries, deleteEntry, updateEntry } = useTracker();
  const { clients } = useClients();
  const { auth } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskType | 'All'>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.platform.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || entry.status === statusFilter;
    const matchesTaskType = taskTypeFilter === 'All' || entry.taskType === taskTypeFilter;
    const matchesClient = isReadOnly 
      ? entry.clientId === auth?.clientId 
      : clientFilter === 'All' || entry.clientId === clientFilter;
      
    return matchesSearch && matchesStatus && matchesTaskType && matchesClient;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Client', 'Task Type', 'Platform', 'URL', 'Status', 'Indexed on Google', 'Engagement Level', 'Notes', 'Last Updated'];
    const csvRows = [headers.join(',')];

    for (const entry of filteredEntries) {
      const clientName = clients.find(c => c.id === entry.clientId)?.name || '';
      const row = [
        entry.date,
        `"${clientName.replace(/"/g, '""')}"`,
        entry.taskType,
        `"${entry.platform.replace(/"/g, '""')}"`,
        `"${entry.url.replace(/"/g, '""')}"`,
        entry.status,
        entry.indexed,
        entry.engagement,
        `"${entry.notes.replace(/"/g, '""')}"`,
        entry.lastUpdated
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeClass = (status: Status) => {
    switch (status) {
      case 'Live': return 'badge-live';
      case 'Pending': return 'badge-pending';
      case 'Removed': return 'badge-removed';
      case 'Completed': return 'badge-completed';
      default: return '';
    }
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete);
      toast.success('Entry deleted successfully');
      setEntryToDelete(null);
    }
  };

  const handleSaveEdit = (id: string, updated: Partial<Entry>) => {
    const activeClient = isReadOnly ? clients.find(c => c.id === auth?.clientId) : null;
    const customUrl = activeClient?.googleSheetUrl;
    updateEntry(id, updated, customUrl);
  };

  return (
    <div className="card animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>Tracker Entries</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '200px' }}
            />
          </div>
          
          <select 
            className="form-input" 
            style={{ width: '140px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | 'All')}
          >
            <option value="All">All Statuses</option>
            <option value="Live">Live</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Removed">Removed</option>
          </select>
          
          <select 
            className="form-input" 
            style={{ width: '150px' }}
            value={taskTypeFilter}
            onChange={(e) => setTaskTypeFilter(e.target.value as TaskType | 'All')}
          >
            <option value="All">All Task Types</option>
            <option value="Article">Article</option>
            <option value="PR">PR</option>
            <option value="Outreach">Outreach</option>
            <option value="Content">Content</option>
            <option value="SEO">SEO</option>
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
              <th>Task Type</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Indexed</th>
              <th>Engagement</th>
              {!isReadOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 6 : 8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No entries found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredEntries.map(entry => {
                let formattedDate = entry.date;
                try {
                  const d = new Date(entry.date);
                  if (!isNaN(d.getTime())) {
                    // Try to format it cleanly. If the original string was just "YYYY-MM-DD", 
                    // this will handle it. If it's an ISO string, it will parse it correctly too.
                    formattedDate = d.toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                  }
                } catch(e) {}
                
                return (
                <tr key={entry.id}>
                  <td>{formattedDate}</td>
                  {!isReadOnly && (
                    <td><span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{clients.find(c => c.id === entry.clientId)?.name || '—'}</span></td>
                  )}
                  <td><span style={{ fontWeight: 500 }}>{entry.taskType}</span></td>
                  <td>
                    {entry.url ? (
                      <a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.platform}</a>
                    ) : (
                      entry.platform
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(entry.status)}`}>{entry.status}</span>
                  </td>
                  <td>{entry.indexed}</td>
                  <td>{entry.engagement}</td>
                  {!isReadOnly && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => setEntryToEdit(entry)}
                          style={{ color: 'var(--color-primary)', padding: '0.25rem', borderRadius: '4px' }}
                          title="Edit Entry"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => setEntryToDelete(entry.id)}
                          style={{ color: '#ef4444', padding: '0.25rem', borderRadius: '4px' }}
                          title="Delete Entry"
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

      {/* Edit Entry Modal */}
      {entryToEdit && typeof document !== 'undefined' && createPortal(
        <EditEntryModal 
          entry={entryToEdit}
          onClose={() => setEntryToEdit(null)}
          onSave={handleSaveEdit}
          isReadOnly={isReadOnly}
        />,
        document.body
      )}

      {/* Delete Confirmation Modal using React Portal */}
      {entryToDelete && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', margin: 0, transform: 'none', animation: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '50%', color: '#ef4444' }}>
                <AlertTriangle size={32} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Delete Entry</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setEntryToDelete(null)}>
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
