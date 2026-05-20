import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Entry, Status, EngagementLevel, TaskType } from '../types';
import { useClients } from '../context/ClientsContext';

interface EditEntryModalProps {
  entry: Entry;
  onClose: () => void;
  onSave: (id: string, updated: Partial<Entry>) => void;
  isReadOnly?: boolean;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({ entry, onClose, onSave, isReadOnly }) => {
  const { clients } = useClients();
  const [formData, setFormData] = useState({
    date: entry.date,
    clientId: entry.clientId || '',
    taskType: entry.taskType,
    platform: entry.platform,
    url: entry.url,
    status: entry.status,
    indexed: entry.indexed,
    engagement: entry.engagement,
    notes: entry.notes,
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
    onSave(entry.id, formData);
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
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        className="card animate-fade-in" 
        style={{ 
          maxWidth: '600px', 
          width: '100%', 
          margin: 'auto',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Edit Entry
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
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {!isReadOnly && (
              <div>
                <label className="form-label">Client</label>
                <select 
                  className="form-input" 
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">Task Type</label>
              <select 
                className="form-input" 
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value as TaskType })}
                required
              >
                <option value="Article">Article</option>
                <option value="PR">PR</option>
                <option value="Outreach">Outreach</option>
                <option value="Content">Content</option>
                <option value="SEO">SEO</option>
              </select>
            </div>

            <div>
              <label className="form-label">Platform</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                placeholder="e.g., Medium, LinkedIn"
                required
              />
            </div>

            <div>
              <label className="form-label">URL</label>
              <input 
                type="url" 
                className="form-input" 
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="form-label">Status</label>
              <select 
                className="form-input" 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                required
              >
                <option value="Live">Live</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Removed">Removed</option>
              </select>
            </div>

            <div>
              <label className="form-label">Google Indexed</label>
              <select 
                className="form-input" 
                value={formData.indexed}
                onChange={(e) => setFormData({ ...formData, indexed: e.target.value as 'Yes' | 'No' })}
                required
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="form-label">Engagement Level</label>
              <select 
                className="form-input" 
                value={formData.engagement}
                onChange={(e) => setFormData({ ...formData, engagement: e.target.value as EngagementLevel })}
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
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
            <button type="submit" className="btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
