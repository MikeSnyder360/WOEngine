// Helper functions for program data.
// Import the data to use in calculations.

import { LEVELS, CIRCUIT } from './program.default';

const JS_DAY_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function dayKeyFor(date = new Date()) {
  return JS_DAY_TO_KEY[date.getDay()];
}

export function targetFor(station, levelKey) {
  return station.targets[levelKey];
}

export function estimateCircuitMinutes(levelKey) {
  const level = LEVELS[levelKey];
  const countStations = CIRCUIT.filter((s) => s.kind === 'count').length;
  const holdSec = CIRCUIT.filter((s) => s.kind === 'hold').reduce(
    (sum, s) => sum + s.targets[levelKey],
    0
  );
  const perRoundSec = countStations * 35 + holdSec + countStations * level.restSec;
  const totalSec = perRoundSec * level.rounds + level.roundRestSec * (level.rounds - 1);
  return Math.round(totalSec / 60);
}
