import { useAuth } from '../context/AuthContext';
import { useClients } from '../context/ClientsContext';
import type { Client } from '../types';
import { ClipboardList, CalendarDays, LogOut, Users, Sliders, TrendingUp } from 'lucide-react';

export type AppView =
  | { page: 'tracker' }
  | { page: 'clients' }
  | { page: 'leads' }
  | { page: 'settings' }
  | { page: 'calendar'; clientId: string };

interface SidebarProps {
  view: AppView;
  onNavigate: (v: AppView) => void;
}

const NavItem = ({
  icon, label, active, color, onClick,
}: {
  icon: React.ReactNode; label: string; active: boolean;
  color?: string; onClick: () => void;
}) => (
  <button onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%',
      padding: '0.55rem 0.875rem', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontSize: '0.85rem', fontWeight: active ? 600 : 400, textAlign: 'left',
      transition: 'all 0.15s',
      backgroundColor: active ? (color ? `${color}22` : 'rgba(255,255,255,0.12)') : 'transparent',
      color: active ? (color || 'white') : 'rgba(255,255,255,0.55)',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    {active && (
      <span style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', backgroundColor: color || 'white', flexShrink: 0 }} />
    )}
  </button>
);

const SectionLabel = ({ label }: { label: string }) => (
  <div style={{ padding: '0.5rem 0.875rem 0.25rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
    {label}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ view, onNavigate }) => {
  const { auth, logout } = useAuth();
  const { clients } = useClients();

  const isSuperAdmin = auth?.role === 'superadmin';
  const clientUser = auth?.role === 'client'
    ? clients.find(c => c.id === auth.clientId)
    : null;

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <img src="/icon.png" alt="Admanics" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'white', margin: 0, lineHeight: 1.2 }}>Admanics</p>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)', margin: 0 }}>Reporting Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.625rem' }}>
        {isSuperAdmin && (
          <>
            <SectionLabel label="Navigation" />
            <NavItem
              icon={<ClipboardList size={15} />}
              label="Main Tracker"
              active={view.page === 'tracker'}
              onClick={() => onNavigate({ page: 'tracker' })}
            />
            <NavItem
              icon={<Users size={15} />}
              label={`Clients (${clients.length})`}
              active={view.page === 'clients'}
              onClick={() => onNavigate({ page: 'clients' })}
            />
            <NavItem
              icon={<TrendingUp size={15} />}
              label="Daily Leads"
              active={view.page === 'leads'}
              onClick={() => onNavigate({ page: 'leads' })}
            />
            <NavItem
              icon={<Sliders size={15} />}
              label="Settings"
              active={view.page === 'settings'}
              onClick={() => onNavigate({ page: 'settings' })}
            />

            {clients.length > 0 && (
              <>
                <SectionLabel label="Calendars" />
                {clients.map((c: Client) => (
                  <NavItem
                    key={c.id}
                    icon={<span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c.color, flexShrink: 0, display: 'inline-block' }} />}
                    label={c.name}
                    active={view.page === 'calendar' && (view as { page: 'calendar'; clientId: string }).clientId === c.id}
                    color={c.color}
                    onClick={() => onNavigate({ page: 'calendar', clientId: c.id })}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* Client user — sees Live Tracker + their calendar */}
        {clientUser && (
          <>
            <SectionLabel label="Navigation" />
            <NavItem
              icon={<ClipboardList size={15} />}
              label="Live Tracker"
              active={view.page === 'tracker'}
              onClick={() => onNavigate({ page: 'tracker' })}
            />
            <NavItem
              icon={<TrendingUp size={15} />}
              label="Daily Leads"
              active={view.page === 'leads'}
              onClick={() => onNavigate({ page: 'leads' })}
            />
            <SectionLabel label="My Calendar" />
            <NavItem
              icon={<span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: clientUser.color, display: 'inline-block' }} />}
              label={clientUser.name}
              active={view.page === 'calendar'}
              color={clientUser.color}
              onClick={() => onNavigate({ page: 'calendar', clientId: clientUser.id })}
            />
            <NavItem
              icon={<CalendarDays size={15} />}
              label="Content Calendar"
              active={view.page === 'calendar'}
              color={clientUser.color}
              onClick={() => onNavigate({ page: 'calendar', clientId: clientUser.id })}
            />
          </>
        )}

      </nav>

      {/* Bottom — user info + logout */}
      <div style={{ padding: '0.75rem 0.625rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ padding: '0.5rem 0.875rem', marginBottom: '0.25rem' }}>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Logged in as</p>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
            {isSuperAdmin ? 'Super Admin' : clientUser?.name ?? 'Client'}
          </p>
        </div>
        <button onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.875rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, backgroundColor: 'transparent', color: 'rgba(255,255,255,0.45)', transition: 'all 0.15s', textAlign: 'left' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
          <LogOut size={14} />Logout
        </button>
      </div>
    </aside>
  );
};
