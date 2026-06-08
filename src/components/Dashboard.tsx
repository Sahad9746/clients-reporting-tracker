import { useState, useMemo } from 'react';
import { useTracker } from '../context/TrackerContext';
import { useLeads } from '../context/LeadsContext';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Radio, Clock, CheckCircle2, TrendingUp, Target, BarChart3 } from 'lucide-react';

type DaysFilter = '7' | '14' | '30' | 'all';

export const Dashboard: React.FC = () => {
  const { entries } = useTracker();
  const { dailyLeads } = useLeads();
  const { auth } = useAuth();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [daysFilter, setDaysFilter] = useState<DaysFilter>('30'); // Default to last 30 days

  const clientEntries = auth?.role === 'client' && auth.clientId
    ? entries.filter(e => e.clientId === auth.clientId)
    : entries;

  const clientLeads = auth?.role === 'client' && auth.clientId
    ? dailyLeads.filter(l => l.clientId === auth.clientId)
    : dailyLeads;

  // Filter leads by selected day preset
  const filteredLeadsByDays = useMemo(() => {
    if (daysFilter === 'all') return clientLeads;
    
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - parseInt(daysFilter));
    const limitStr = limitDate.toISOString().split('T')[0];
    
    return clientLeads.filter(l => l.date >= limitStr);
  }, [clientLeads, daysFilter]);

  const totalTasks = clientEntries.length;
  const liveItems = clientEntries.filter(e => e.status === 'Live').length;
  const pendingItems = clientEntries.filter(e => e.status === 'Pending').length;
  const completedItems = clientEntries.filter(e => e.status === 'Completed').length;
  
  // Total leads is calculated based on the day filter selection
  const totalLeads = filteredLeadsByDays.reduce((sum, l) => sum + (l.leads ?? 0), 0);

  // Group leads by date (last 10 days with lead entries in the filtered range)
  const dailyData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredLeadsByDays.forEach(l => {
      const dateStr = l.date;
      groups[dateStr] = (groups[dateStr] || 0) + (l.leads ?? 0);
    });
    const sortedDates = Object.keys(groups).sort();
    const lastTenDates = sortedDates.slice(-10);
    return lastTenDates.map(date => ({
      date,
      leads: groups[date],
    }));
  }, [filteredLeadsByDays]);

  // Group leads by source (top 5 sources in the filtered range)
  const platformBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredLeadsByDays.forEach(l => {
      const source = l.source || 'Other';
      groups[source] = (groups[source] || 0) + (l.leads ?? 0);
    });
    return Object.entries(groups)
      .map(([name, leads]) => ({ name, leads }))
      .filter(item => item.leads > 0)
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 5);
  }, [filteredLeadsByDays]);

  // Check if we should render anything at all
  if (totalTasks === 0 && clientLeads.length === 0) return null;

  const maxLeads = Math.max(...dailyData.map(d => d.leads), 5);
  const maxSourceLeads = Math.max(...platformBreakdown.map(p => p.leads), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
        {totalTasks > 0 && (
          <div className="card animate-fade-in" style={{ animationDelay: '0s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '12px', color: '#3730a3' }}>
                <ClipboardList size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Tasks</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalTasks}</p>
              </div>
            </div>
          </div>
        )}

        {liveItems > 0 && (
          <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-status-live-bg)', borderRadius: '12px', color: 'var(--color-status-live-text)' }}>
                <Radio size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Live Items</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{liveItems}</p>
              </div>
            </div>
          </div>
        )}

        {pendingItems > 0 && (
          <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-status-pending-bg)', borderRadius: '12px', color: 'var(--color-status-pending-text)' }}>
                <Clock size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Pending</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{pendingItems}</p>
              </div>
            </div>
          </div>
        )}

        {completedItems > 0 && (
          <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-status-completed-bg)', borderRadius: '12px', color: 'var(--color-status-completed-text)' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Completed</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{completedItems}</p>
              </div>
            </div>
          </div>
        )}

        <div className="card animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '12px', color: '#0369a1' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Leads ({daysFilter === 'all' ? 'All Time' : `${daysFilter}d`})
              </h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0284c7' }}>{totalLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Lead Analysis & Source Breakdown Panels */}
      {clientLeads.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Daily Leads Bar Chart */}
          <div className="card animate-fade-in" style={{ animationDelay: '0.5s', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} style={{ color: 'var(--color-accent)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>Daily Lead Generation</h3>
              </div>

              {/* Day Filter presets */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                {(['7', '14', '30', 'all'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDaysFilter(d)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      backgroundColor: daysFilter === d ? 'white' : 'transparent',
                      color: daysFilter === d ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      boxShadow: daysFilter === d ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    {d === 'all' ? 'All Time' : `Last ${d} Days`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: '220px', position: 'relative', marginTop: '1rem', paddingBottom: '30px' }}>
              {/* Background grid lines */}
              <div style={{ position: 'absolute', inset: '0 0 30px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <div style={{ borderBottom: '1px dashed var(--color-border)', width: '100%' }} />
                <div style={{ borderBottom: '1px dashed var(--color-border)', width: '100%' }} />
                <div style={{ borderBottom: '1px dashed var(--color-border)', width: '100%' }} />
                <div style={{ borderBottom: '1px dashed var(--color-border)', width: '100%' }} />
              </div>

              {/* Bars container */}
              <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', zIndex: 1 }}>
                {dailyData.length === 0 ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                    No leads generated during this period.
                  </div>
                ) : (
                  dailyData.map((d, idx) => {
                    const percentage = (d.leads / maxLeads) * 100;
                    const formattedDate = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    return (
                      <div
                        key={d.date}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flex: 1,
                          height: '100%',
                          justifyContent: 'flex-end',
                          position: 'relative'
                        }}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Tooltip */}
                        {hoveredIndex === idx && (
                          <div style={{
                            position: 'absolute',
                            bottom: `calc(${percentage}% + 20px)`,
                            backgroundColor: 'var(--color-primary-dark)',
                            color: '#fff',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            boxShadow: 'var(--shadow-md)',
                            zIndex: 10,
                            transform: 'translateX(-50%)',
                            left: '50%',
                            animation: 'fadeIn var(--transition-fast)'
                          }}>
                            <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.7 }}>{d.date}</span>
                            {d.leads} lead{d.leads !== 1 ? 's' : ''}
                          </div>
                        )}

                        {/* Bar Graphic */}
                        <div
                          style={{
                            width: '55%',
                            maxWidth: '24px',
                            height: `${percentage}%`,
                            background: d.leads > 0 
                              ? 'linear-gradient(180deg, #3b82f6 0%, #6366f1 100%)' 
                              : '#e2e8f0',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            boxShadow: d.leads > 0 ? '0 2px 4px rgba(59, 130, 246, 0.15)' : 'none'
                          }}
                        />

                        {/* X-axis date label */}
                        <span style={{
                          position: 'absolute',
                          bottom: '-24px',
                          fontSize: '0.68rem',
                          color: 'var(--color-text-muted)',
                          whiteSpace: 'nowrap',
                          fontWeight: 500
                        }}>
                          {formattedDate}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Top Lead Sources Breakdown */}
          <div className="card animate-fade-in" style={{ animationDelay: '0.6s', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} style={{ color: '#10b981' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>Top Lead Sources</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', height: '100%' }}>
              {platformBreakdown.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No lead source data available for this period.
                </div>
              ) : (
                platformBreakdown.map((p) => {
                  const percentage = (p.leads / maxSourceLeads) * 100;
                  return (
                    <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--color-text-main)' }}>{p.name}</span>
                        <span style={{ color: '#0284c7' }}>{p.leads} lead{p.leads !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                            borderRadius: '4px',
                            transition: 'width 0.8s ease-out'
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
