'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BrandingEditor from '@/components/BrandingEditor';
import ProgramEditor from '@/components/ProgramEditor';

interface App {
  id: string;
  appName: string;
  iosBundleId: string;
  androidPackageName: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBranding, setShowBranding] = useState(false);
  const [showProgram, setShowProgram] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchApps();
    }
  }, [session]);

  async function fetchApps() {
    try {
      const response = await fetch(`/api/apps?tenantId=${session?.user?.id}`);
      const data = await response.json();
      setApps(data);
      if (data.length > 0) {
        setSelectedAppId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateApp() {
    const appName = prompt('App name:');
    const iosBundleId = prompt('iOS Bundle ID (e.g., com.company.app):');
    const androidPackageName = prompt('Android Package Name (e.g., com.company.app):');

    if (!appName || !iosBundleId || !androidPackageName) return;

    try {
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: session?.user?.id,
          appName,
          iosBundleId,
          androidPackageName,
        }),
      });

      if (response.ok) {
        await fetchApps();
      } else {
        alert('Failed to create app');
      }
    } catch (error) {
      alert('Error creating app');
    }
  }

  async function handleBuildApp() {
    if (!selectedAppId) return;

    try {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          platforms: ['ios', 'android'],
        }),
      });

      if (response.ok) {
        const build = await response.json();
        alert(`Build ${build.id} started! Check status in build history.`);
      } else {
        const error = await response.json();
        alert(`Build failed: ${error.error}`);
      }
    } catch (error) {
      alert('Error starting build');
    }
  }

  if (status === 'loading' || loading) {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {session?.user?.name}</p>

      <section>
        <h2>Your Apps</h2>

        {apps.length === 0 ? (
          <p>No apps yet.</p>
        ) : (
          <div>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              style={{ padding: '0.5rem', marginBottom: '1rem' }}
            >
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.appName}
                </option>
              ))}
            </select>
          </div>
        )}

        <button onClick={handleCreateApp} style={{ marginRight: '0.5rem' }}>
          Create App
        </button>

        {selectedAppId && (
          <button onClick={handleBuildApp} style={{ backgroundColor: '#28a745' }}>
            Build & Submit
          </button>
        )}
      </section>

      {selectedAppId && (
        <>
          <section>
            <button onClick={() => setShowBranding(!showBranding)}>
              {showBranding ? 'Hide' : 'Show'} Branding Editor
            </button>
            {showBranding && (
              <BrandingEditor
                appId={selectedAppId}
                onSave={async (data) => {
                  console.log('Saving branding:', data);
                  // TODO: Call API to save brand manifest
                }}
              />
            )}
          </section>

          <section>
            <button onClick={() => setShowProgram(!showProgram)}>
              {showProgram ? 'Hide' : 'Show'} Program Editor
            </button>
            {showProgram && (
              <ProgramEditor
                appId={selectedAppId}
                onSave={async (data) => {
                  console.log('Saving program:', data);
                  // TODO: Call API to save program version
                }}
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}
