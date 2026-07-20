import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Wall-clock stopwatch that counts up, with the same pause-on-background
 * behaviour as the circuit runner. Used by the rope flow days, which are
 * open-ended rather than a fixed sequence of phases.
 */
export function useStopwatch({ autoStart = true } = {}) {
  const [bankedMs, setBankedMs] = useState(0);
  const [runningSince, setRunningSince] = useState(() => (autoStart ? Date.now() : null));
  const [now, setNow] = useState(() => Date.now());
  const [startedAtISO] = useState(() => new Date().toISOString());

  const isPaused = runningSince === null;
  const elapsedMs = bankedMs + (runningSince === null ? 0 : Math.max(0, now - runningSince));

  useEffect(() => {
    if (isPaused) return undefined;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [isPaused]);

  const pause = useCallback(() => {
    setRunningSince((since) => {
      if (since === null) return null;
      setBankedMs((banked) => banked + Math.max(0, Date.now() - since));
      return null;
    });
  }, []);

  const resume = useCallback(() => {
    setRunningSince((since) => (since === null ? Date.now() : since));
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') pause();
    });
    return () => sub.remove();
  }, [pause]);

  return { elapsedMs, isPaused, pause, resume, startedAtISO };
}
