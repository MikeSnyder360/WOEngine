'use client';

import { useEffect, useState } from 'react';

interface Build {
  id: string;
  status: string;
  platforms: string[];
  costCents: number;
  createdAt: string;
  completedAt: string | null;
  failureReason: string | null;
}

export default function BuildHistory({ appId }: { appId: string }) {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuilds();
    const interval = setInterval(fetchBuilds, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [appId]);

  async function fetchBuilds() {
    try {
      const response = await fetch(`/api/builds?appId=${appId}`);
      const data = await response.json();
      setBuilds(data);
    } catch (error) {
      console.error('Failed to fetch builds:', error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    queued: '#ffc107',
    building: '#17a2b8',
    submitting: '#17a2b8',
    succeeded: '#28a745',
    failed: '#dc3545',
    cancelled: '#6c757d',
  };

  if (loading) {
    return <p>Loading build history...</p>;
  }

  if (builds.length === 0) {
    return <p>No builds yet.</p>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Build History</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Platforms</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Cost</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((build) => (
            <tr key={build.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>{build.id.substring(0, 8)}</td>
              <td style={{ padding: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: statusColors[build.status] || '#ccc',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                >
                  {build.status}
                </span>
              </td>
              <td style={{ padding: '0.5rem' }}>{build.platforms.join(', ')}</td>
              <td style={{ padding: '0.5rem' }}>${(build.costCents / 100).toFixed(2)}</td>
              <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                {new Date(build.createdAt).toLocaleDateString()} {new Date(build.createdAt).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {builds.some((b) => b.failureReason) && (
        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          <p style={{ color: '#dc3545' }}>
            <strong>Note:</strong> Some builds failed. Check the status column for details.
          </p>
        </div>
      )}
    </div>
  );
}
