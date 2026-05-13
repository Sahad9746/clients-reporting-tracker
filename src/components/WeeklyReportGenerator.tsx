import { useState } from 'react';
import { Sparkles, Copy, Save, CheckCircle, AlertCircle, Loader2, BarChart2, FileText, Activity, Calendar } from 'lucide-react';
import { fetchWeeklyData, generateAISummary, saveReportToSanity } from '../services/geminiService';
import type { Client } from '../types';
import { toast } from 'react-hot-toast';

type ReportState = 'idle' | 'fetching' | 'generating' | 'success' | 'error';

interface Props {
  client: Client;
  onClose: () => void;
}

const today = new Date().toISOString().split('T')[0];
const nDaysAgo = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const PRESETS = [
  { label: 'Last 7 Days',  start: nDaysAgo(7),  end: today },
  { label: 'Last 14 Days', start: nDaysAgo(14), end: today },
  { label: 'Last 30 Days', start: nDaysAgo(30), end: today },
  { label: 'This Month',   start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end: today },
];

export const WeeklyReportGenerator: React.FC<Props> = ({ client }) => {
  const [state, setState] = useState<ReportState>('idle');
  const [report, setReport] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<{
    total: number; live: number; pending: number; completed: number; inReview: number;
    dateRangeStart: string; dateRangeEnd: string;
    byType: Record<string, number>;
  } | null>(null);

  // Date range state
  const [startDate, setStartDate] = useState(nDaysAgo(7));
  const [endDate, setEndDate] = useState(today);
  const [activePreset, setActivePreset] = useState('Last 7 Days');

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setStartDate(preset.start);
    setEndDate(preset.end);
    setActivePreset(preset.label);
  };

  const handleGenerate = async () => {
    if (startDate > endDate) {
      toast.error('Start date must be before end date.');
      return;
    }
    setState('fetching');
    setError('');
    setSaved(false);
    try {
      const data = await fetchWeeklyData(client.id, startDate, endDate);
      setStats({ ...data.tasksSummary, dateRangeStart: data.dateRangeStart, dateRangeEnd: data.dateRangeEnd });
      setState('generating');
      const markdown = await generateAISummary(data, client);
      setReport(markdown);
      setState('success');
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
      setState('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    toast.success('Report copied to clipboard!');
  };

  const handleSave = async () => {
    if (!stats) return;
    try {
      await saveReportToSanity(report, {
        tasksSummary: { ...stats!, inReview: stats!.inReview ?? 0 }, entries: [],
        dateRangeStart: stats!.dateRangeStart,
        dateRangeEnd: stats!.dateRangeEnd,
      }, client);
      setSaved(true);
      toast.success('Report saved to Sanity!');
    } catch {
      toast.error('Failed to save report.');
    }
  };

  const isLoading = state === 'fetching' || state === 'generating';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Date Range Selector */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={15} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--color-primary)' }}>Select Date Range</span>
        </div>

        {/* Preset Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              style={{
                padding: '0.3rem 0.85rem',
                borderRadius: 9999,
                border: `1.5px solid ${activePreset === p.label ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: activePreset === p.label ? 'var(--color-primary)' : 'transparent',
                color: activePreset === p.label ? 'white' : 'var(--color-text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setActivePreset('Custom')}
            style={{
              padding: '0.3rem 0.85rem',
              borderRadius: 9999,
              border: `1.5px solid ${activePreset === 'Custom' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: activePreset === 'Custom' ? 'var(--color-primary)' : 'transparent',
              color: activePreset === 'Custom' ? 'white' : 'var(--color-text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Custom Range
          </button>
        </div>

        {/* Date Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }}>From</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              max={endDate}
              onChange={e => { setStartDate(e.target.value); setActivePreset('Custom'); }}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }}>To</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              min={startDate}
              max={today}
              onChange={e => { setEndDate(e.target.value); setActivePreset('Custom'); }}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.55rem 1.25rem', alignSelf: 'flex-start' }}
        >
          {isLoading ? (
            <><Loader2 size={15} className="animate-spin" /> {state === 'fetching' ? 'Searching Sanity...' : 'Writing Report...'}</>
          ) : (
            <><Sparkles size={15} /> Generate AI Report for {client.name}</>
          )}
        </button>
      </div>

      {/* Pulsing progress bar */}
      {isLoading && (
        <div style={{ background: 'var(--color-surface)', borderRadius: 8, overflow: 'hidden', height: 5 }}>
          <div style={{
            height: '100%',
            width: state === 'fetching' ? '40%' : '85%',
            background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
            transition: 'width 0.8s ease',
          }} />
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
          <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.82rem', color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Two-column result layout */}
      {state === 'success' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.25rem', alignItems: 'start' }}>

          {/* LEFT: Editable Report */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>AI-Generated Report</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}>
                  <Copy size={13} /> Copy
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saved} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.8rem', fontSize: '0.78rem', opacity: saved ? 0.6 : 1 }}>
                  {saved ? <><CheckCircle size={13} /> Saved</> : <><Save size={13} /> Save to Sanity</>}
                </button>
              </div>
            </div>
            <textarea
              value={report}
              onChange={e => setReport(e.target.value)}
              style={{ width: '100%', minHeight: 360, padding: '1rem', fontFamily: '"Inter", monospace', fontSize: '0.8rem', lineHeight: 1.7, color: 'var(--color-text-main)', backgroundColor: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 10, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '-0.25rem' }}>You can edit the report above before saving or copying.</p>
          </div>

          {/* RIGHT: Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>Data Summary</span>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{stats!.dateRangeStart} → {stats!.dateRangeEnd}</span>
              </div>
              <StatRow icon={<BarChart2 size={14} />} label="Total Analyzed" value={stats!.total} color="#7c3aed" />
              <StatRow icon={<Dot color="#22c55e" />} label="Live" value={stats!.live} color="#16a34a" />
              <StatRow icon={<Dot color="#f59e0b" />} label="Pending" value={stats!.pending} color="#d97706" />
              <StatRow icon={<Dot color="#3b82f6" />} label="Completed" value={stats!.completed} color="#2563eb" />
            </div>

            {Object.keys(stats!.byType).length > 0 && (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <FileText size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)' }}>By Task Type</span>
                </div>
                {Object.entries(stats!.byType).map(([type, count]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{type}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Dot = ({ color }: { color: string }) => (
  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }} />
);

const StatRow = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon}
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{label}</span>
    </div>
    <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</span>
  </div>
);
