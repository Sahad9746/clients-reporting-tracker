import { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { Plus } from 'lucide-react';
import type { TaskType, Status, EngagementLevel } from '../types';

export const AddEntryForm: React.FC = () => {
  const { addEntry } = useTracker();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskType, setTaskType] = useState<TaskType>('Article');
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('Live');
  const [indexed, setIndexed] = useState<'Yes' | 'No'>('Yes');
  const [engagement, setEngagement] = useState<EngagementLevel>('Medium');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform) return;

    addEntry({
      date,
      taskType,
      platform,
      url,
      status,
      indexed,
      engagement,
      notes
    });

    // Reset some fields
    setPlatform('');
    setUrl('');
    setNotes('');
    setStatus('Live');
  };

  return (
    <div className="card animate-fade-in" style={{ animationDelay: '0.5s' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '1.5rem' }}>Add New Entry</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Task Type</label>
            <select className="form-input" value={taskType} onChange={e => setTaskType(e.target.value as TaskType)}>
              <option value="Article">Article</option>
              <option value="PR">PR</option>
              <option value="Outreach">Outreach</option>
              <option value="Content">Content</option>
              <option value="SEO">SEO</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Platform (e.g., Medium, Forbes)</label>
            <input type="text" className="form-input" value={platform} onChange={e => setPlatform(e.target.value)} required placeholder="Enter platform name" />
          </div>

          <div className="form-group">
            <label className="form-label">URL (Link)</label>
            <input type="url" className="form-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={status} onChange={e => setStatus(e.target.value as Status)}>
              <option value="Live">Live</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Removed">Removed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Indexed on Google</label>
            <select className="form-input" value={indexed} onChange={e => setIndexed(e.target.value as 'Yes' | 'No')}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Engagement Level</label>
            <select className="form-input" value={engagement} onChange={e => setEngagement(e.target.value as EngagementLevel)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
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
            placeholder="Add any relevant notes here..."
            style={{ resize: 'vertical' }}
          ></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary">
            <Plus size={18} />
            Add Entry
          </button>
        </div>
      </form>
    </div>
  );
};
