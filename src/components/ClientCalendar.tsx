import { useState, useMemo } from 'react';
import { useClients } from '../context/ClientsContext';
import type { CalendarChannel, CalendarStatus, Client, ContentTask } from '../types';
import { EditTaskModal } from './EditTaskModal';
import { Modal } from './Modal';
import { WeeklyReportGenerator } from './WeeklyReportGenerator';
import {
  MessageSquare, HelpCircle, FileText, CheckSquare, BarChart2,
  ChevronLeft, ChevronRight, ChevronDown, Trash2, Pencil, Sparkles,
} from 'lucide-react';

// ── Config ──────────────────────────────────────────────────────────────────
const CHANNEL_META: Record<CalendarChannel, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  reddit:    { label: 'Reddit',    color: '#2563eb', bg: '#dbeafe', icon: <MessageSquare size={11} /> },
  quora:     { label: 'Quora',     color: '#16a34a', bg: '#dcfce7', icon: <HelpCircle size={11} /> },
  seo:       { label: 'SEO',       color: '#ea580c', bg: '#ffedd5', icon: <FileText size={11} /> },
  approval:  { label: 'Approval',  color: '#7c3aed', bg: '#ede9fe', icon: <CheckSquare size={11} /> },
  reporting: { label: 'Reporting', color: '#475569', bg: '#f1f5f9', icon: <BarChart2 size={11} /> },
};

const STATUS_META: Record<CalendarStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#854d0e', bg: '#fef08a' },
  in_review: { label: 'In Review', color: '#1d4ed8', bg: '#dbeafe' },
  approved:  { label: 'Approved',  color: '#7c3aed', bg: '#ede9fe' },
  live:      { label: 'Live',      color: '#166534', bg: '#dcfce7' },
  blocked:   { label: 'Blocked',   color: '#991b1b', bg: '#fee2e2' },
};

const ALL_CHANNELS: CalendarChannel[] = ['reddit', 'quora', 'seo', 'approval', 'reporting'];
const ALL_STATUSES: CalendarStatus[] = ['pending', 'in_review', 'approved', 'live', 'blocked'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Helpers ─────────────────────────────────────────────────────────────────
function deriveInitialMonth(tasks: ContentTask[]): Date {
  const dates = tasks.map(t => t.scheduledDate).filter(Boolean).sort();
  if (dates.length > 0) {
    const [y, m] = dates[0].split('-').map(Number);
    return new Date(y, m - 1, 1);
  }
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}

// ── StatusPill ──────────────────────────────────────────────────────────────
const StatusPill = ({ status, taskId, clientId }: { status: CalendarStatus; taskId: string; clientId: string }) => {
  const { updateTaskStatus } = useClients();
  const m = STATUS_META[status];
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 600, backgroundColor: m.bg, color: m.color, border: 'none', cursor: 'pointer' }}>
        {m.label}<ChevronDown size={10} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 20, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', minWidth: 120 }}>
            {ALL_STATUSES.map(s => {
              const sm = STATUS_META[s];
              return (
                <button key={s} onClick={() => { updateTaskStatus(clientId, taskId, s); setOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '7px 10px', fontSize: '0.78rem', fontWeight: s === status ? 700 : 400, color: 'var(--color-text-main)', backgroundColor: s === status ? 'var(--color-background)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-background)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = s === status ? 'var(--color-background)' : 'transparent')}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: sm.color, flexShrink: 0 }} />{sm.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ── TaskChip (inside calendar cell) ─────────────────────────────────────────
const TaskChip = ({ task, isReadOnly, onEdit, onDelete }: {
  task: ContentTask; isReadOnly: boolean;
  onEdit: (t: ContentTask) => void; onDelete: (id: string) => void;
}) => {
  const meta = CHANNEL_META[task.channel];
  const sMeta = STATUS_META[task.status];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', borderRadius: 5, backgroundColor: meta.bg, border: `1px solid ${meta.color}33`, fontSize: '0.68rem', fontWeight: 500, color: meta.color, cursor: 'default', position: 'relative', transition: 'all 0.15s' }}
    >
      <span style={{ flexShrink: 0 }}>{meta.icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{task.title}</span>
      <span style={{ marginLeft: 'auto', padding: '1px 5px', borderRadius: 4, backgroundColor: sMeta.bg, color: sMeta.color, fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>{sMeta.label}</span>
      {hovered && !isReadOnly && (
        <div style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2, backgroundColor: 'white', borderRadius: 4, padding: '1px', boxShadow: 'var(--shadow-sm)', zIndex: 5 }}>
          <button onClick={() => onEdit(task)} style={{ display: 'flex', padding: 3, borderRadius: 3, border: 'none', background: 'transparent', color: '#7c3aed', cursor: 'pointer' }} title="Edit"><Pencil size={10} /></button>
          <button onClick={() => onDelete(task.id)} style={{ display: 'flex', padding: 3, borderRadius: 3, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }} title="Delete"><Trash2 size={10} /></button>
        </div>
      )}
    </div>
  );
};

// ── Task Detail Panel (shown when clicking a day) ───────────────────────────
const DayPanel = ({ date, tasks, clientId, isReadOnly, onEdit, onClose }: {
  date: string; tasks: ContentTask[]; clientId: string; isReadOnly: boolean;
  onEdit: (t: ContentTask) => void; onClose: () => void;
}) => {
  const { deleteTask } = useClients();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const formatted = new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={`Tasks for ${formatted}`} 
      maxWidth="1000px"
      headerStyle={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', alignItems: 'start' }}>
        {tasks.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No tasks scheduled for this day.</p>
        ) : (
          tasks.map(task => {
            const cm = CHANNEL_META[task.channel];
            const isExpanded = expandedTaskId === task.id;
            return (
              <div key={task.id} style={{ border: '1px solid var(--color-border)', borderRadius: 10, backgroundColor: 'var(--color-background)', transition: 'all 0.2s ease-in-out', position: 'relative' }}>
                <div style={{ height: 3, backgroundColor: cm.color, borderTopLeftRadius: 9, borderTopRightRadius: 9 }} />
                
                {/* Clickable Header */}
                <div 
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  style={{ padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 600, backgroundColor: cm.bg, color: cm.color }}>
                      {cm.icon}{cm.label}
                    </span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>{task.title}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <StatusPill status={task.status} taskId={task.id} clientId={clientId} />
                    {!isReadOnly && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => onEdit(task)} style={{ display: 'flex', padding: 5, borderRadius: 5, border: 'none', backgroundColor: '#ede9fe', color: '#7c3aed', cursor: 'pointer' }} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => setConfirmDeleteId(task.id)} style={{ display: 'flex', padding: 5, borderRadius: 5, border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer' }} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div style={{ padding: '1rem', backgroundColor: 'white', animation: 'fadeIn 0.2s ease-out' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', margin: '0 0 0.5rem', lineHeight: 1.6 }}>{task.description}</p>
                    
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                      {task.approvalNote && task.approvalNote !== '—' && (
                        <div>
                          <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Approval Workflow</strong>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>{task.approvalNote}</p>
                        </div>
                      )}
                      {task.deliverableCount && (
                        <div>
                          <strong style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Deliverables</strong>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>{task.deliverableCount}</p>
                        </div>
                      )}
                    </div>

                    {/* Delete confirmation */}
                    {confirmDeleteId === task.id && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600, margin: 0 }}>Are you sure you want to completely remove this task?</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => deleteTask(clientId, task.id)} className="btn" style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 12px', fontSize: '0.8rem' }}>Yes, Delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};

// ── Main ClientCalendar ──────────────────────────────────────────────────────
interface ClientCalendarProps {
  client: Client;
  isReadOnly: boolean;
}

export const ClientCalendar: React.FC<ClientCalendarProps> = ({ client, isReadOnly }) => {
  const { taskMap } = useClients();
  const tasks = taskMap[client.id] ?? [];

  const [activeChannel, setActiveChannel] = useState<CalendarChannel | 'all'>('all');
  const [editingTask, setEditingTask] = useState<ContentTask | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(() => deriveInitialMonth(tasks));
  const [showReportModal, setShowReportModal] = useState(false);

  const filteredTasks = tasks.filter(t => activeChannel === 'all' || t.channel === activeChannel);

  // Group by date: "YYYY-MM-DD" -> tasks[]
  const tasksByDate = useMemo(() => {
    const map = new Map<string, ContentTask[]>();
    filteredTasks.forEach(t => {
      const existing = map.get(t.scheduledDate) ?? [];
      map.set(t.scheduledDate, [...existing, t]);
    });
    return map;
  }, [filteredTasks]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const liveTotal = tasks.filter(t => t.status === 'live').length;
  const inReviewTotal = tasks.filter(t => t.status === 'in_review').length;
  const pendingTotal = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
      {/* Page banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)', borderRadius: 14, padding: '1.5rem 2rem', marginBottom: '1.5rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `${client.color}33`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: client.color }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>{client.pilotLabel}</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{client.name} — Content Calendar</h2>
            <p style={{ opacity: 0.55, fontSize: '0.82rem', marginTop: '0.25rem' }}>{tasks.length} tasks · {liveTotal} live · {inReviewTotal} in review · {pendingTotal} pending</p>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => setShowReportModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, backdropFilter: 'blur(4px)', transition: 'all 0.2s', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              <Sparkles size={15} /> Generate Report
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {(() => {
          let articles = 0, rpMin = 0, rpMax = 0, rcMin = 0, rcMax = 0, qaMin = 0, qaMax = 0, blMin = 0, blMax = 0;
          tasks.forEach(t => {
            const d = t.deliverableCount.toLowerCase();
            const nums = d.match(/\d+/g)?.map(Number) || [0];
            const min = nums[0]; const max = nums.length > 1 ? nums[1] : nums[0];
            
            if (d.includes('article') && !d.includes('live')) { articles += min; }
            else if (d.includes('post') && t.channel === 'reddit') { rpMin += min; rpMax += max; }
            else if (d.includes('comment') && t.channel === 'reddit') { rcMin += min; rcMax += max; }
            else if (d.includes('answer') && t.channel === 'quora') { qaMin += min; qaMax += max; }
            else if (d.includes('backlink')) { blMin += min; blMax += max; }
          });
          const format = (min: number, max: number) => min === max ? `${min}` : `${min}-${max}`;
          
          const stats = [
            { label: 'Articles', value: `${articles}`, detail: 'target' },
            { label: 'Reddit Posts', value: format(rpMin, rpMax), detail: 'target' },
            { label: 'Reddit Comments', value: format(rcMin, rcMax), detail: 'net live' },
            { label: 'Quora Answers', value: format(qaMin, qaMax), detail: 'live' },
            { label: 'Backlinks', value: format(blMin, blMax), detail: 'contextual ≥40%' }
          ];

          return stats.map(stat => (
            <div key={stat.label} className="card" style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1, marginBottom: '0.15rem' }}>{stat.value}</p>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{stat.label}</p>
              <p style={{ fontSize: '0.67rem', color: 'var(--color-text-muted)', marginTop: 1 }}>{stat.detail}</p>
            </div>
          ));
        })()}
      </div>

      {/* Channel filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500, marginRight: '0.25rem' }}>Filter:</span>
        {(['all', ...ALL_CHANNELS] as const).map(ch => {
          const isActive = activeChannel === ch;
          const meta = ch === 'all' ? null : CHANNEL_META[ch];
          return (
            <button key={ch} onClick={() => setActiveChannel(ch)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', border: isActive ? `2px solid ${meta?.color ?? 'var(--color-primary)'}` : '2px solid var(--color-border)', backgroundColor: isActive ? (meta?.bg ?? 'var(--color-primary)') : 'var(--color-surface)', color: isActive ? (meta?.color ?? 'white') : 'var(--color-text-muted)' }}>
              {meta?.icon}{ch === 'all' ? 'All' : meta!.label}
            </button>
          );
        })}
      </div>

      {/* Month Calendar */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-primary)' }}>
          <button onClick={prevMonth}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', margin: 0 }}>{MONTHS[month]} {year}</h3>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{filteredTasks.filter(t => t.scheduledDate.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length} tasks this month</p>
          </div>
          <button onClick={nextMonth}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)', backgroundColor: '#f8fafc' }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < weeks.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              {week.map((day, di) => {
                const ds = day ? dateStr(day) : '';
                const dayTasks = day ? (tasksByDate.get(ds) ?? []) : [];
                const isToday = ds === today;
                const isSelected = ds === selectedDate;
                const hasTasks = dayTasks.length > 0;

                return (
                  <div key={di}
                    onClick={() => day && hasTasks && setSelectedDate(isSelected ? null : ds)}
                    style={{ minHeight: 100, padding: '0.5rem', borderRight: di < 6 ? '1px solid var(--color-border)' : 'none', backgroundColor: !day ? '#fafafa' : isSelected ? `${client.color}0d` : isToday ? '#fef9c3' : 'white', cursor: hasTasks ? 'pointer' : 'default', transition: 'background 0.15s', position: 'relative' }}
                    onMouseEnter={e => { if (day && hasTasks && !isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={e => { if (day && !isSelected) e.currentTarget.style.backgroundColor = !day ? '#fafafa' : isToday ? '#fef9c3' : 'white'; }}>

                    {/* Day number */}
                    {day && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: isToday ? 800 : 500, color: isToday ? '#ca8a04' : 'var(--color-text-muted)', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: isToday ? '#fef08a' : 'transparent' }}>{day}</span>
                        {hasTasks && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: client.color, backgroundColor: `${client.color}18`, padding: '1px 5px', borderRadius: 9999 }}>{dayTasks.length}</span>
                        )}
                      </div>
                    )}

                    {/* Task chips — show up to 2, then "+N more" */}
                    {day && dayTasks.slice(0, 2).map(task => (
                      <div key={task.id} style={{ marginBottom: 3 }}>
                        <TaskChip task={task} isReadOnly={isReadOnly} onEdit={setEditingTask} onDelete={() => { /* handled via panel */ }} />
                      </div>
                    ))}
                    {day && dayTasks.length > 2 && (
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: client.color, cursor: 'pointer' }}>
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Day modal */}
      {selectedDate && (
        <DayPanel
          date={selectedDate}
          tasks={tasksByDate.get(selectedDate) ?? []}
          clientId={client.id}
          isReadOnly={isReadOnly}
          onEdit={t => { setEditingTask(t); setSelectedDate(null); }}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Edit task modal */}
      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          clientId={client.id}
        />
      )}

      {/* Weekly Report Generator Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={`✨ AI Weekly Report — ${client.name}`}
        maxWidth="860px"
      >
        <WeeklyReportGenerator client={client} onClose={() => setShowReportModal(false)} />
      </Modal>

      <div style={{ marginTop: '1rem', padding: '0.75rem 1.25rem', backgroundColor: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
        <strong style={{ color: 'var(--color-text-main)' }}>Tip: </strong>
        Click any day with tasks to open a detail panel. Click a task's pencil icon to edit it.
        {isReadOnly && ' Contact your admin to modify tasks.'}
      </div>
    </div>
  );
};
