import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { SCHEDULE, dayKeyFor } from './src/data/program';
import { loadProgram } from './src/data/programSource';
import CircuitScreen from './src/screens/CircuitScreen';
import FlowScreen from './src/screens/FlowScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import RatingScreen from './src/screens/RatingScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import { initAudio } from './src/sound';
import {
  DEFAULT_SETTINGS,
  deleteSession,
  findPrevious,
  loadHistory,
  loadSettings,
  saveSession,
  saveSettings,
} from './src/storage';

// Six screens doesn't earn a navigation library, so this is a plain switch.
// Flow: home → circuit|flow → rating → summary → home
export default function App() {
  const [screen, setScreen] = useState('home');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [history, setHistory] = useState([]);
  const [ready, setReady] = useState(false);

  // A finished workout hands over a *builder* rather than a session, because the
  // difficulty rating isn't known until the next screen.
  const [pendingBuilder, setPendingBuilder] = useState(null);
  const [saved, setSaved] = useState(null);
  const [previous, setPrevious] = useState(null);

  useEffect(() => {
    (async () => {
      const [loadedSettings, loadedHistory] = await Promise.all([
        loadSettings(),
        loadHistory(),
        loadProgram(), // Load program (network → cache → bundled fallback)
      ]);
      setSettings(loadedSettings);
      setHistory(loadedHistory);
      setReady(true);
      initAudio();
    })();
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // setState treats a bare function as an updater, hence the extra arrow.
  const handleFinish = useCallback((builder) => {
    setPendingBuilder(() => builder);
    setScreen('rating');
  }, []);

  const handleRating = useCallback(
    async (rating) => {
      if (!pendingBuilder) return;
      const session = pendingBuilder(rating);

      // Resolve the comparison target before the new session lands in history.
      setPrevious(findPrevious(history, { type: session.type, level: session.level }));

      const nextHistory = await saveSession(session);
      setHistory(nextHistory);
      setSaved(session);
      setPendingBuilder(null);
      setScreen('summary');
    },
    [history, pendingBuilder]
  );

  const handleDelete = useCallback(async (id) => {
    setHistory(await deleteSession(id));
  }, []);

  const goHome = useCallback(() => {
    setSaved(null);
    setPrevious(null);
    setPendingBuilder(null);
    setScreen('home');
  }, []);

  if (!ready) return <StatusBar style="light" />;

  const today = SCHEDULE[dayKeyFor()];

  return (
    <>
      <StatusBar style="light" />

      {screen === 'home' && (
        <HomeScreen
          settings={settings}
          historyCount={history.length}
          onChangeLevel={(level) => updateSettings({ level })}
          onToggleSound={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          onStartCircuit={() => setScreen('circuit')}
          onStartFlow={() => setScreen('flow')}
          onOpenHistory={() => setScreen('history')}
        />
      )}

      {screen === 'circuit' && (
        <CircuitScreen
          levelKey={settings.level}
          soundEnabled={settings.soundEnabled}
          onFinish={handleFinish}
          onQuit={goHome}
        />
      )}

      {screen === 'flow' && (
        <FlowScreen
          soundEnabled={settings.soundEnabled}
          note={today.note}
          onFinish={handleFinish}
          onQuit={goHome}
        />
      )}

      {screen === 'rating' && <RatingScreen onSubmit={handleRating} />}

      {screen === 'summary' && saved && (
        <SummaryScreen session={saved} previous={previous} onDone={goHome} />
      )}

      {screen === 'history' && (
        <HistoryScreen history={history} onBack={() => setScreen('home')} onDelete={handleDelete} />
      )}
    </>
  );
}
