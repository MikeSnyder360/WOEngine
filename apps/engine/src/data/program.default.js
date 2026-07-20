// Single source of truth for the training program.
//
// This file contains pure data only: LEVELS, CIRCUIT, SCHEDULE.
// At build time, the orchestrator may regenerate this from tenant program data.
// At runtime, programSource.js may fetch from an API and replace this.

export const LEVELS = {
  reduced: {
    key: 'reduced',
    label: 'Ramping Up',
    sub: 'Reduced',
    rounds: 3,
    restSec: 30,
    roundRestSec: 120,
  },
  middle: {
    key: 'middle',
    label: 'Intermediate',
    sub: 'Middle Ground',
    rounds: 4,
    restSec: 30,
    roundRestSec: 90,
  },
  advanced: {
    key: 'advanced',
    label: 'Advanced',
    sub: 'Original Target',
    rounds: 4,
    restSec: 30,
    roundRestSec: 90,
  },
};

export const LEVEL_ORDER = ['reduced', 'middle', 'advanced'];

export const CIRCUIT = [
  {
    order: 1,
    name: 'Sprinter Sneak',
    detail: 'Underhand',
    rope: true,
    kind: 'count',
    unit: 'beats',
    targets: { reduced: '40', middle: '70', advanced: '100' },
  },
  {
    order: 2,
    name: 'Standard Push-Ups',
    rope: false,
    kind: 'count',
    unit: 'reps',
    targets: { reduced: '8–12', middle: '15–20', advanced: '20–30' },
  },
  {
    order: 3,
    name: 'Skier Sneak',
    detail: 'Overhand',
    rope: true,
    kind: 'count',
    unit: 'beats',
    targets: { reduced: '40', middle: '70', advanced: '100' },
  },
  {
    order: 4,
    name: 'Standard Sit-Ups',
    rope: false,
    kind: 'count',
    unit: 'reps',
    targets: { reduced: '12–15', middle: '20–25', advanced: '25–40' },
  },
  {
    order: 5,
    name: "Hanuman's Dance",
    detail: 'Hybrid',
    rope: true,
    kind: 'count',
    unit: 'beats',
    targets: { reduced: '40', middle: '70', advanced: '100' },
  },
  {
    order: 6,
    name: 'Active Recovery Flow',
    rope: true,
    kind: 'count',
    unit: 'beats',
    targets: { reduced: '40', middle: '50', advanced: '60' },
  },
  {
    order: 7,
    name: 'Plank Finisher',
    detail: 'Static',
    rope: false,
    kind: 'hold',
    unit: 'seconds',
    targets: { reduced: 30, middle: 45, advanced: 60 },
  },
];

export const SCHEDULE = {
  mon: {
    day: 'Monday',
    short: 'Mon',
    focus: 'HIIT Circuit',
    mode: 'circuit',
    column: 'Ramping Up (Reduced)',
    note: 'Focus on maximum rope velocity during the 40 beats.',
  },
  tue: {
    day: 'Tuesday',
    short: 'Tue',
    focus: 'Active Recovery',
    mode: 'flow',
    column: 'Rope Flow Only',
    note: '15–20 mins of gentle, continuous Overhand Matador/Milly Rock. No intervals.',
  },
  wed: {
    day: 'Wednesday',
    short: 'Wed',
    focus: 'HIIT Circuit',
    mode: 'circuit',
    column: 'Ramping Up (Reduced)',
    note: 'Push for strict, clean form on the push-ups and sit-ups.',
  },
  thu: {
    day: 'Thursday',
    short: 'Thu',
    focus: 'Full Rest',
    mode: 'rest',
    column: 'OFF',
    note: 'Let your upper body and ankle fully recover.',
  },
  fri: {
    day: 'Friday',
    short: 'Fri',
    focus: 'HIIT Circuit',
    mode: 'circuit',
    column: 'Ramping Up (Reduced)',
    note: 'If feeling strong, try the Middle Ground reps for just the rope stations.',
  },
  sat: {
    day: 'Saturday',
    short: 'Sat',
    focus: 'Active Recovery',
    mode: 'flow',
    column: 'Rope Flow Only',
    note: '15–20 mins of fluid, low-intensity patterns to flush out muscle soreness.',
  },
  sun: {
    day: 'Sunday',
    short: 'Sun',
    focus: 'Full Rest',
    mode: 'rest',
    column: 'OFF',
    note: 'Mental and physical reset.',
  },
};

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const FLOW_MILESTONES_MIN = [15, 20];
