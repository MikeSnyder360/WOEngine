import { useState } from 'react';

interface ProgramEditorProps {
  appId: string;
  onSave?: (data: any) => Promise<void>;
}

export default function ProgramEditor({ appId, onSave }: ProgramEditorProps) {
  const [programJson, setProgramJson] = useState('{\n  "LEVELS": {},\n  "CIRCUIT": [],\n  "SCHEDULE": {}\n}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      const data = JSON.parse(programJson);

      const response = await fetch('/api/program-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          programJson: data,
        }),
      });

      if (response.ok) {
        alert('Program saved and published!');
        if (onSave) await onSave(data);
      } else {
        setError('Failed to save program');
      }
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginTop: '1rem' }}>
      <h3>Program Editor</h3>

      <p style={{ fontSize: '0.9rem', color: '#666' }}>Enter workout program JSON (LEVELS, CIRCUIT, SCHEDULE):</p>

      <textarea
        value={programJson}
        onChange={(e) => setProgramJson(e.target.value)}
        style={{
          width: '100%',
          height: '300px',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '0.5rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
        }}
      />

      {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={loading}
        style={{ marginTop: '1rem', backgroundColor: '#28a745', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {loading ? 'Saving...' : 'Save & Publish Program'}
      </button>
    </div>
  );
}
