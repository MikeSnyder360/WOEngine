import { useState } from 'react';

interface BrandingEditorProps {
  appId: string;
  onSave: (data: any) => Promise<void>;
}

export default function BrandingEditor({ appId, onSave }: BrandingEditorProps) {
  const [appName, setAppName] = useState('');
  const [colors, setColors] = useState({ bg: '#0B0D10', work: '#3DDC84', rest: '#3D9BDC' });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await onSave({
        appName,
        colorTokens: colors,
      });
      alert('Branding saved!');
    } catch (error) {
      alert('Error saving branding');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Branding Editor</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>App Name:</label>
        <input
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="e.g., My Fitness App"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Primary Color (Work):</label>
        <input type="color" value={colors.work} onChange={(e) => setColors({ ...colors, work: e.target.value })} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Secondary Color (Rest):</label>
        <input type="color" value={colors.rest} onChange={(e) => setColors({ ...colors, rest: e.target.value })} />
      </div>

      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Branding'}
      </button>
    </div>
  );
}
