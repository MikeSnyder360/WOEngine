// Public API for program data and helpers.
// Re-exports from program.default (data) and program.engine (functions).
//
// At runtime, programSource.js may override the data with fetched content.
// At build time, the orchestrator may regenerate program.default.js from tenant data.

export { LEVELS, LEVEL_ORDER, CIRCUIT, SCHEDULE, DAY_KEYS, FLOW_MILESTONES_MIN } from './program.default';
export { dayKeyFor, targetFor, estimateCircuitMinutes } from './program.engine';
