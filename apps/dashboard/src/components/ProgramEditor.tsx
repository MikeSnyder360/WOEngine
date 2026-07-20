import { useState } from 'react';

interface ProgramEditorProps {
  appId: string;
  onSave: (data: any) => Promise<void>;
}

export default function ProgramEditor({ appId, onSave }: ProgramEditorProps) {
  const [programJson, setProgramJson] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      const data = JSON.parse(programJson);
      await onSave(data);
      alert('Program saved!');
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Program Editor</h2>

      <p>Enter workout program JSON (LEVELS, CIRCUIT, SCHEDULE):</p>

      <textarea
        value={programJson}
        onChange={(e) => setProgramJson(e.target.value)}
        style={{
          width: '100%',
          height: '300px',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '0.5rem',
        }}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Program'}
      </button>
    </div>
  );
}
