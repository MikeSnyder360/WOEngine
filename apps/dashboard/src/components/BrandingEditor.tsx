import { useState } from 'react';

interface BrandingEditorProps {
  appId: string;
  onSave?: (data: any) => Promise<void>;
}

export default function BrandingEditor({ appId, onSave }: BrandingEditorProps) {
  const [appName, setAppName] = useState('');
  const [colors, setColors] = useState({
    bg: '#0B0D10',
    surface: '#151A20',
    surfaceHigh: '#1E252E',
    border: '#2A333F',
    text: '#F2F5F8',
    textDim: '#93A1B0',
    textFaint: '#5D6B7A',
    work: '#3DDC84',
    rest: '#3D9BDC',
    hold: '#DCA23D',
    danger: '#DC5B4B',
    accent: '#8B6BF0',
    onWork: '#06210F',
    onRest: '#04192B',
    onHold: '#2A1A02',
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const response = await fetch('/api/brand-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          appDisplayName: appName,
          colorTokens: colors,
        }),
      });

      if (response.ok) {
        alert('Branding saved!');
        if (onSave) await onSave({ appName, colorTokens: colors });
      } else {
        alert('Error saving branding');
      }
    } catch (error) {
      alert('Error saving branding');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginTop: '1rem' }}>
      <h3>Branding Editor</h3>

      <div style={{ marginBottom: '1rem' }}>
        <label>App Name:</label>
        <input
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="e.g., My Fitness App"
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label>Primary Color (Work):</label>
          <input
            type="color"
            value={colors.work}
            onChange={(e) => setColors({ ...colors, work: e.target.value })}
            style={{ width: '100%', height: '40px', marginTop: '0.5rem' }}
          />
        </div>
        <div>
          <label>Secondary Color (Rest):</label>
          <input
            type="color"
            value={colors.rest}
            onChange={(e) => setColors({ ...colors, rest: e.target.value })}
            style={{ width: '100%', height: '40px', marginTop: '0.5rem' }}
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} style={{ backgroundColor: '#28a745', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        {loading ? 'Saving...' : 'Save Branding'}
      </button>
    </div>
  );
}
