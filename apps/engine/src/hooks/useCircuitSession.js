import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { CIRCUIT, LEVELS } from '../data/program';
import { play } from '../sound';

/**
 * The whole session is expanded into a flat list of phases up front. Advancing is
 * then just an index bump, which keeps "what comes next" out of the render path
 * and makes the sequence trivial to reason about (and to test).
 *
 *   round 1: station 1 → rest → station 2 → … → station 6 → rest → plank
 *            → round rest
 *   round 2: …
 *   round 3: … → plank → done   (no trailing round rest)
 */
function buildPhases(levelKey) {
  const level = LEVELS[levelKey];
  const phases = [];

  for (let round = 0; round < level.rounds; round += 1) {
    CIRCUIT.forEach((station, stationIndex) => {
      const isHold = station.kind === 'hold';
      phases.push({
        kind: isHold ? 'hold' : 'station',
        round,
        stationIndex,
        station,
        target: station.targets[levelKey],
        // Count stations run open-ended until you press the button.
        durationMs: isHold ? station.targets[levelKey] * 1000 : null,
      });

      const isLastStation = stationIndex === CIRCUIT.length - 1;
      if (!isLastStation) {
        phases.push({
          kind: 'rest',
          round,
          stationIndex,
          nextStation: CIRCUIT[stationIndex + 1],
          durationMs: level.restSec * 1000,
        });
      }
    });

    if (round < level.rounds - 1) {
      phases.push({
        kind: 'roundRest',
        round,
        nextRound: round + 1,
        durationMs: level.roundRestSec * 1000,
      });
    }
  }

  return phases;
}

export function useCircuitSession(levelKey, { soundEnabled = true } = {}) {
  const phases = useMemo(() => buildPhases(levelKey), [levelKey]);
  const level = LEVELS[levelKey];

  const [index, setIndex] = useState(0);
  const [bankedMs, setBankedMs] = useState(0); // time in this phase before the current run
  const [runningSince, setRunningSince] = useState(() => Date.now()); // null ⇒ paused
  const [now, setNow] = useState(() => Date.now());
  const [splits, setSplits] = useState([]);
  const [restMs, setRestMs] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [startedAtISO] = useState(() => new Date().toISOString());

  const phase = isFinished ? null : phases[index];
  const isPaused = runningSince === null;

  const cue = useCallback(
    (name) => {
      if (soundEnabled) play(name);
    },
    [soundEnabled]
  );

  // Elapsed is always derived from wall-clock timestamps rather than counted
  // ticks, so a dropped frame or a slow render can never make the timer drift.
  const elapsedMs = bankedMs + (runningSince === null ? 0 : Math.max(0, now - runningSince));
  const remainingMs =
    phase?.durationMs == null ? null : Math.max(0, phase.durationMs - elapsedMs);

  useEffect(() => {
    if (isPaused || isFinished) return undefined;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [isPaused, isFinished]);

  const advance = useCallback(() => {
    if (isFinished) return;

    const current = phases[index];
    if (!current) return;

    const spent = bankedMs + (runningSince === null ? 0 : Math.max(0, Date.now() - runningSince));

    if (current.kind === 'station' || current.kind === 'hold') {
      setSplits((prev) => [
        ...prev,
        {
          round: current.round,
          order: current.station.order,
          name: current.station.name,
          detail: current.station.detail ?? null,
          target: current.target,
          unit: current.station.unit,
          kind: current.kind,
          activeMs: spent,
        },
      ]);
    } else {
      setRestMs((prev) => prev + spent);
    }

    const nextIndex = index + 1;
    if (nextIndex >= phases.length) {
      setIsFinished(true);
      setRunningSince(null);
      cue('done');
      return;
    }

    const next = phases[nextIndex];
    if (next.kind === 'station' || next.kind === 'hold') cue('go');
    else if (next.kind === 'roundRest') cue('done');

    setIndex(nextIndex);
    setBankedMs(0);
    setRunningSince(Date.now());
    setNow(Date.now());
  }, [bankedMs, cue, index, isFinished, phases, runningSince]);

  // Countdown phases advance themselves; count stations wait for the button.
  useEffect(() => {
    if (isFinished || isPaused || !phase || phase.durationMs == null) return;
    if (elapsedMs >= phase.durationMs) advance();
  }, [advance, elapsedMs, isFinished, isPaused, phase]);

  // 3-2-1 audible countdown into the end of any timed phase.
  const lastTickRef = useRef(null);
  useEffect(() => {
    lastTickRef.current = null;
  }, [index]);
  useEffect(() => {
    if (isFinished || isPaused || !phase || phase.durationMs == null) return;
    const secondsLeft = Math.ceil((phase.durationMs - elapsedMs) / 1000);
    if (secondsLeft <= 3 && secondsLeft >= 1 && lastTickRef.current !== secondsLeft) {
      lastTickRef.current = secondsLeft;
      cue('tick');
    }
  }, [cue, elapsedMs, isFinished, isPaused, phase]);

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

  // Backgrounding pauses rather than counting the interruption as workout time.
  // We deliberately ignore 'inactive' — on iOS that fires for a notification
  // shade pull or a control-centre swipe, which shouldn't stop your set.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') pause();
    });
    return () => sub.remove();
  }, [pause]);

  const activeMs = splits.reduce((sum, s) => sum + s.activeMs, 0);

  const buildSession = useCallback(
    (rating) => {
      const rounds = Array.from({ length: level.rounds }, (_, round) =>
        splits.filter((s) => s.round === round)
      );
      return {
        id: `${startedAtISO}-circuit`,
        startedAt: startedAtISO,
        type: 'circuit',
        level: levelKey,
        rating,
        rounds,
        activeMs,
        restMs,
        totalMs: activeMs + restMs,
      };
    },
    [activeMs, level.rounds, levelKey, restMs, splits, startedAtISO]
  );

  return {
    phase,
    phaseIndex: index,
    totalPhases: phases.length,
    round: phase?.round ?? level.rounds - 1,
    totalRounds: level.rounds,
    elapsedMs,
    remainingMs,
    activeMs,
    restMs,
    splits,
    isPaused,
    isFinished,
    advance,
    pause,
    resume,
    buildSession,
  };
}
