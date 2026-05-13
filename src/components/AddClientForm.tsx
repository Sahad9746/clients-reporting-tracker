import { useState } from 'react';
import { useClients } from '../context/ClientsContext';
import { Plus } from 'lucide-react';

const PRESET_COLORS = [
  { hex: '#7c3aed', name: 'Purple' }, { hex: '#2563eb', name: 'Blue' },
  { hex: '#16a34a', name: 'Green' }, { hex: '#ea580c', name: 'Orange' },
  { hex: '#db2777', name: 'Pink' }, { hex: '#0891b2', name: 'Cyan' },
  { hex: '#dc2626', name: 'Red' }, { hex: '#ca8a04', name: 'Amber' },
];

interface Props { onClose?: () => void; }

export const AddClientForm: React.FC<Props> = ({ onClose }) => {
  const { addClient } = useClients();
  const [name, setName] = useState('');
  const [pilotLabel, setPilotLabel] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[1].hex);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameError('Client name is required'); return; }
    if (password !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    
    addClient({ name: name.trim(), pilotLabel: pilotLabel.trim() || 'Active Client', color, password: password.trim() || undefined, googleSheetUrl: googleSheetUrl.trim() || undefined });
    setName(''); setPilotLabel(''); setColor(PRESET_COLORS[1].hex); setPassword(''); setConfirmPassword(''); setGoogleSheetUrl(''); setNameError(''); setPasswordError('');
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Client Name *</label>
          <input type="text" className="form-input" placeholder="e.g. Acme Corp" value={name}
            onChange={e => { setName(e.target.value); setNameError(''); }}
            style={nameError ? { borderColor: '#ef4444' } : {}} />
          {nameError && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>{nameError}</p>}
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Pilot / Period Label</label>
          <input type="text" className="form-input" placeholder="Month 1 Pilot · June 2026" value={pilotLabel} onChange={e => setPilotLabel(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Client Password
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </label>
          <input type={showPassword ? "text" : "password"} className="form-input" placeholder="Set login password (optional)" value={password} onChange={e => { setPassword(e.target.value); setPasswordError(''); }} style={passwordError ? { borderColor: '#ef4444' } : {}} />
        </div>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Confirm Password</label>
          <input type={showPassword ? "text" : "password"} className="form-input" placeholder="Confirm password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }} style={passwordError ? { borderColor: '#ef4444' } : {}} disabled={!password} />
        </div>
      </div>
      {passwordError && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '-0.5rem', marginBottom: '1rem' }}>{passwordError}</p>}
      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
        If set, the client can log in from the login screen using this password.
      </p>

      <div className="form-group">
        <label className="form-label">Google Sheet App URL</label>
        <input type="url" className="form-input" placeholder="https://script.google.com/macros/s/.../exec" value={googleSheetUrl} onChange={e => setGoogleSheetUrl(e.target.value)} />
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
          If provided, tracker data will sync to this specific sheet.
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Accent Color</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {PRESET_COLORS.map(c => (
            <button key={c.hex} type="button" title={c.name} onClick={() => setColor(c.hex)}
              style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: c.hex, border: 'none', outline: color === c.hex ? `3px solid ${c.hex}` : '3px solid transparent', outlineOffset: 2, cursor: 'pointer', transition: 'transform 0.1s', transform: color === c.hex ? 'scale(1.15)' : 'scale(1)' }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
        {onClose && <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>}
        <button type="submit" className="btn btn-primary"><Plus size={16} />Create Client</button>
      </div>
    </form>
  );
};
