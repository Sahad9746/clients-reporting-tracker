import { useState } from 'react';
import { useClients } from '../context/ClientsContext';
import { EditClientModal } from './EditClientModal';
import type { Client } from '../types';
import { Calendar, Trash2, Users, Pencil } from 'lucide-react';

interface ClientListProps {
  isReadOnly: boolean;
  onSelectClient: (clientId: string) => void;
}

const ClientCard = ({
  client, taskCount, liveCount, isReadOnly, onSelect, onDelete, onEdit,
}: {
  client: Client; taskCount: number; liveCount: number;
  isReadOnly: boolean; onSelect: () => void; onDelete: () => void; onEdit: () => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const progressPct = taskCount > 0 ? Math.round((liveCount / taskCount) * 100) : 0;

  return (
    <div
      style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${confirmDelete ? '#ef4444' : 'var(--color-border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s', cursor: 'pointer', position: 'relative' }}
      className="cal-task-card"
      onClick={() => !confirmDelete && onSelect()}
    >
      {/* Color accent bar */}
      <div style={{ height: 4, backgroundColor: client.color }} />

      <div style={{ padding: '1.25rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${client.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={18} style={{ color: client.color }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0, lineHeight: 1.2 }}>{client.name}</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0 }}>{client.pilotLabel}</p>
            </div>
          </div>

          {/* Action buttons */}
          {!isReadOnly && (
            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
              <button onClick={e => { e.stopPropagation(); onEdit(); }} title="Edit client"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.color = '#7c3aed'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                <Pencil size={13} />
              </button>
              {!client.isDefault && (
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(true); }} title="Delete client"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Delete confirmation */}
        {confirmDelete ? (
          <div className="animate-fade-in">
            <p style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600, marginBottom: '0.5rem' }}>
              Delete "{client.name}" and all its tasks?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={e => { e.stopPropagation(); onDelete(); }} className="btn"
                style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 12px', fontSize: '0.78rem' }}>Yes, delete</button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} className="btn btn-secondary"
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.875rem' }}>
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{taskCount}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>tasks</p>
              </div>
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{liveCount}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>live</p>
              </div>
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#854d0e', lineHeight: 1 }}>{taskCount - liveCount}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>pending</p>
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Progress</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{progressPct}% live</span>
              </div>
              <div style={{ width: '100%', height: 5, backgroundColor: 'var(--color-border)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: client.color, borderRadius: 9999, transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: client.color, fontWeight: 600 }}>
              <Calendar size={14} /> View Calendar →
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ClientList: React.FC<ClientListProps> = ({ isReadOnly, onSelectClient }) => {
  const { clients, taskMap, deleteClient } = useClients();
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  return (
    <div className="animate-fade-in">
      {/* Client grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {clients.map(client => {
          const tasks = taskMap[client.id] ?? [];
          return (
            <ClientCard
              key={client.id}
              client={client}
              taskCount={tasks.length}
              liveCount={tasks.filter(t => t.status === 'live').length}
              isReadOnly={isReadOnly}
              onSelect={() => onSelectClient(client.id)}
              onDelete={() => deleteClient(client.id)}
              onEdit={() => setEditingClient(client)}
            />
          );
        })}
      </div>

      {/* Edit client modal */}
      {editingClient && (
        <EditClientModal
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          client={editingClient}
        />
      )}
    </div>
  );
};
