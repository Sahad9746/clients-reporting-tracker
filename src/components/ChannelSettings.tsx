import { useState } from 'react';
import { useClients } from '../context/ClientsContext';
import { getChannelIcon } from './ClientCalendar';
import { 
  Plus, Trash2, Sliders, Pencil, MessageSquare, HelpCircle, FileText, CheckSquare, BarChart2,
  Share2, Globe, Tv, Megaphone, Compass, Send, Link, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Curated list of premium icons for channels
const PRESET_ICONS = [
  { name: 'message-square', label: 'Chat / Thread', icon: <MessageSquare size={16} /> },
  { name: 'help-circle', label: 'Q&A / Info', icon: <HelpCircle size={16} /> },
  { name: 'file-text', label: 'SEO / Document', icon: <FileText size={16} /> },
  { name: 'check-square', label: 'Task / Tasklist', icon: <CheckSquare size={16} /> },
  { name: 'bar-chart', label: 'Analytics / Reporting', icon: <BarChart2 size={16} /> },
  { name: 'share', label: 'Social / Share', icon: <Share2 size={16} /> },
  { name: 'globe', label: 'Web / Globe', icon: <Globe size={16} /> },
  { name: 'tv', label: 'Media / TV', icon: <Tv size={16} /> },
  { name: 'megaphone', label: 'Ad / Megaphone', icon: <Megaphone size={16} /> },
  { name: 'compass', label: 'Discovery / Compass', icon: <Compass size={16} /> },
  { name: 'send', label: 'Telegram / Send', icon: <Send size={16} /> },
  { name: 'link', label: 'Backlink / URL', icon: <Link size={16} /> },
  { name: 'zap', label: 'Zap / Alert', icon: <Zap size={16} /> }
];

// Presets of highly professional brand colors
const COLOR_PRESETS = [
  '#2563eb', // Indigo Blue
  '#16a34a', // Forest Green
  '#ea580c', // SEO Orange
  '#7c3aed', // Royal Purple
  '#db2777', // Rose Pink
  '#0891b2', // Ocean Teal
  '#dc2626', // Red
  '#4f46e5', // Royal Blue
  '#059669', // Emerald
  '#ca8a04', // Amber
  '#475569', // Slate Grey
];

// Helper to convert hex to RGBA with low opacity for background pills
function getLightBg(hex: string): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 'rgba(71, 85, 105, 0.15)';
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

export const ChannelSettings: React.FC = () => {
  const { channels, addChannel, updateChannel, deleteChannel } = useClients();

  // Form & Edit states
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [iconName, setIconName] = useState('share');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate value key from label input (disabled in edit mode)
  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (!editingValue) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_+|_-+$)/g, '');
      setValue(slug);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error('Channel name is required');
      return;
    }
    if (!value.trim()) {
      toast.error('Channel key identifier is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const lightBg = getLightBg(color);
      
      if (editingValue) {
        // Edit mode!
        await updateChannel(editingValue, {
          label: label.trim(),
          color,
          bg: lightBg,
          iconName
        });
        setEditingValue(null);
      } else {
        // Create mode!
        if (channels.some(ch => ch.value === value)) {
          toast.error(`Channel with key identifier "${value}" already exists.`);
          return;
        }
        await addChannel({
          label: label.trim(),
          value: value.trim(),
          color,
          bg: lightBg,
          iconName
        });
      }
      
      // Reset form
      setLabel('');
      setValue('');
      setColor('#2563eb');
      setIconName('share');
    } catch (err) {
      toast.error(editingValue ? 'Failed to update channel' : 'Failed to create channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingValue(null);
    setLabel('');
    setValue('');
    setColor('#2563eb');
    setIconName('share');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
      
      {/* LEFT: Existing Channels List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: 12, padding: '1.25rem 1.5rem', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sliders size={18} style={{ opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Calendar Channels</h3>
          </div>
          <p style={{ fontSize: '0.78rem', opacity: 0.7, margin: 0 }}>
            Configure and customize the dropdown options used in reporting calendars.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {channels.map(ch => {
            const previewMeta = {
              color: ch.color,
              bg: ch.bg || getLightBg(ch.color),
              icon: getChannelIcon(ch.iconName, 11)
            };

            const isCurrentEdit = editingValue === ch.value;

            return (
              <div key={ch.value} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: isCurrentEdit ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: 10, backgroundColor: isCurrentEdit ? 'rgba(49, 46, 129, 0.03)' : 'var(--color-surface)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', backgroundColor: previewMeta.bg, color: previewMeta.color }}>
                      {getChannelIcon(ch.iconName, 13)}
                    </span>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>{ch.label}</strong>
                      <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', margin: 0 }}>ID key: <code>{ch.value}</code></p>
                    </div>
                  </div>
                  
                  {/* Live Calendar Chip Preview */}
                  <div style={{ marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.15rem', fontWeight: 600 }}>Calendar Preview:</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 5, backgroundColor: previewMeta.bg, border: `1px solid ${previewMeta.color}33`, fontSize: '0.68rem', fontWeight: 500, color: previewMeta.color }}>
                      {previewMeta.icon}
                      <span>Draft Thread {ch.label}</span>
                      <span style={{ marginLeft: 6, opacity: 0.7, fontSize: '0.6rem', fontWeight: 700 }}>Live</span>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => {
                      setEditingValue(ch.value);
                      setLabel(ch.label);
                      setValue(ch.value);
                      setColor(ch.color);
                      setIconName(ch.iconName);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.6rem', border: 'none', color: '#7c3aed', backgroundColor: '#ede9fe' }}
                    title="Edit / Customize"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete the "${ch.label}" channel? Existing tasks using this channel ID key will fallback to standard grey formatting.`)) {
                        deleteChannel(ch.value);
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.6rem', border: 'none', color: '#ef4444', backgroundColor: '#fee2e2' }}
                    title="Delete Channel"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Dynamic Add / Edit Channel Form */}
      <div className="card" style={{ padding: '1.5rem', alignSelf: 'start', border: '1.5px solid var(--color-border)', borderRadius: 12 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
          {editingValue ? (
            <>
              <Pencil size={16} /> Edit Channel: {channels.find(c => c.value === editingValue)?.label}
            </>
          ) : (
            <>
              <Plus size={16} /> Create Custom Channel
            </>
          )}
        </h3>

        <form onSubmit={handleAddChannel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
          
          <div className="form-group">
            <label className="form-label">Channel Display Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Social, Meta Ad, TikTok"
              value={label}
              onChange={e => handleLabelChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Database Identifier Key (Slug)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. meta_ad"
              value={value}
              onChange={e => setValue(e.target.value)}
              disabled={!!editingValue}
              style={{ backgroundColor: !!editingValue ? '#e2e8f0' : '#f8fafc', color: 'var(--color-text-muted)', cursor: !!editingValue ? 'not-allowed' : 'text' }}
              required
            />
            {editingValue ? (
              <p style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 4 }}>
                Key identifier cannot be modified in edit mode to preserve references in existing tasks.
              </p>
            ) : (
              <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                This unique key will identify the channel in stored tasks. Auto-generated from name.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Brand Theme Color *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ width: 42, height: 36, border: '1.5px solid var(--color-border)', borderRadius: 6, padding: '2px', cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <input
                type="text"
                className="form-input"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="#000000"
                style={{ width: 120 }}
              />
            </div>
            {/* Color Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {COLOR_PRESETS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: c, border: color === c ? '2.5px solid var(--color-primary)' : '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', outline: 'none', transition: 'transform 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Brand Icon *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))', gap: '0.4rem', maxHeight: 120, overflowY: 'auto', padding: '0.5rem', border: '1.5px solid var(--color-border)', borderRadius: 8, backgroundColor: '#f8fafc' }}>
              {PRESET_ICONS.map(pi => {
                const isSelected = iconName === pi.name;
                return (
                  <button
                    type="button"
                    key={pi.name}
                    onClick={() => setIconName(pi.name)}
                    title={pi.label}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, borderRadius: 6, border: isSelected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)', backgroundColor: isSelected ? 'var(--color-surface)' : 'white', color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {pi.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Interactive Preview Card */}
          <div style={{ border: '1.5px dashed var(--color-border)', borderRadius: 10, padding: '1rem', backgroundColor: '#f8fafc', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>Live Design Preview</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, backgroundColor: getLightBg(color), color, fontSize: '0.72rem', fontWeight: 600, border: `1px solid ${color}33` }}>
                {getChannelIcon(iconName, 12)}
                <span>{label || 'Sample Channel'}</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>renders beautifully!</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.625rem', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {editingValue ? (
                <>
                  <Pencil size={15} /> Save Changes
                </>
              ) : (
                <>
                  <Plus size={15} /> Create Channel
                </>
              )}
            </button>

            {editingValue && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.625rem' }}
              >
                Cancel Edit
              </button>
            )}
          </div>

        </form>
      </div>

    </div>
  );
};
