import { useState } from 'react';
import { useClients } from '../context/ClientsContext';
import type { CalendarChannel, CalendarStatus, ContentTask } from '../types';
import { Plus } from 'lucide-react';

const CHANNELS: CalendarChannel[] = ['reddit', 'quora', 'seo', 'approval', 'reporting'];
const STATUSES: CalendarStatus[] = ['pending', 'in_review', 'approved', 'live', 'blocked'];
const STATUS_LABELS: Record<CalendarStatus, string> = { pending: 'Pending', in_review: 'In Review', approved: 'Approved', live: 'Live', blocked: 'Blocked' };
const CHANNEL_LABELS: Record<CalendarChannel, string> = { reddit: 'Reddit', quora: 'Quora', seo: 'SEO / Article', approval: 'Approval', reporting: 'Reporting' };

type FormData = Omit<ContentTask, 'id'>;
const EMPTY = (clientId: string): FormData => ({ title: '', channel: 'seo', week: 1, scheduledDate: '', description: '', approvalNote: '', status: 'pending', clientName: clientId, deliverableCount: '' });

interface Props { clientId: string; onClose?: () => void; }

export const AddCalendarEntry: React.FC<Props> = ({ clientId, onClose }) => {
  const { addTask } = useClients();
  const [form, setForm] = useState<FormData>(() => EMPTY(clientId));
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.scheduledDate) e.scheduledDate = 'Date is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    addTask(clientId, { ...form, title: form.title.trim(), description: form.description.trim() });
    setForm(EMPTY(clientId));
    setErrors({});
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label className="form-label">Task Title *</label>
        <input type="text" className="form-input" placeholder="e.g. Article 7 draft — secondary keyword" value={form.title} onChange={e => set('title', e.target.value)} style={errors.title ? { borderColor: '#ef4444' } : {}} />
        {errors.title && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>{errors.title}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Channel</label>
          <select className="form-input" value={form.channel} onChange={e => set('channel', e.target.value as CalendarChannel)}>
            {CHANNELS.map(ch => <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Week</label>
          <select className="form-input" value={form.week} onChange={e => set('week', Number(e.target.value) as ContentTask['week'])}>
            <option value={1}>Week 1 (Jun 1–7)</option>
            <option value={2}>Week 2 (Jun 8–14)</option>
            <option value={3}>Week 3 (Jun 15–21)</option>
            <option value={4}>Week 4 (Jun 22–28)</option>
            <option value={5}>Week 5 (Jun 29–30)</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Scheduled Date *</label>
          <input type="date" className="form-input" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} style={errors.scheduledDate ? { borderColor: '#ef4444' } : {}} />
          {errors.scheduledDate && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>{errors.scheduledDate}</p>}
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value as CalendarStatus)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Task Description *</label>
        <textarea className="form-input" rows={3} placeholder="What needs to be done — keyword targets, platform, word count, etc." value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical', ...(errors.description ? { borderColor: '#ef4444' } : {}) }} />
        {errors.description && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>{errors.description}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Approval Note / TAT</label>
          <textarea className="form-input" rows={2} placeholder="e.g. 48hr approval TAT" value={form.approvalNote} onChange={e => set('approvalNote', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Deliverable Count</label>
          <input type="text" className="form-input" placeholder="e.g. 8–10 posts" value={form.deliverableCount} onChange={e => set('deliverableCount', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
        {onClose && <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>}
        <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #312e81, #4c1d95)' }}>
          <Plus size={16} />Add Task
        </button>
      </div>
    </form>
  );
};
