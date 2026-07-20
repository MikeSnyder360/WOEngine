// Runtime program data source with three-tier fallback: network → cache → bundled.
// On app startup, attempts to fetch the latest program from a remote URL.
// Falls back to cached data, then to bundled default if needed.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as defaultProgram from './program.default';
import Constants from 'expo-constants';

const CACHE_KEY = 'program:v1';

// Validate that fetched data has the right shape
function isValidProgramData(data) {
  return (
    data &&
    typeof data === 'object' &&
    data.LEVELS &&
    data.CIRCUIT &&
    Array.isArray(data.CIRCUIT) &&
    data.SCHEDULE &&
    typeof data.SCHEDULE === 'object'
  );
}

// Attempt to fetch program from a remote URL (configured per-tenant at build time)
async function fetchRemoteProgram(url) {
  if (!url) return null;

  try {
    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) return null;

    const data = await response.json();
    if (!isValidProgramData(data)) return null;

    // Cache the fetched data
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('[ProgramSource] Failed to fetch remote program:', error.message);
    return null;
  }
}

// Attempt to load cached program data
async function loadCachedProgram() {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (isValidProgramData(data)) return data;
    }
  } catch (error) {
    console.warn('[ProgramSource] Failed to load cached program:', error.message);
  }
  return null;
}

// Load program data with three-tier fallback
export async function loadProgram() {
  // Tier 1: Try to fetch from remote URL (if configured)
  const programUrl = Constants.expoConfig?.extra?.programUrl;
  if (programUrl) {
    const remote = await fetchRemoteProgram(programUrl);
    if (remote) return remote;
  }

  // Tier 2: Fall back to cached data
  const cached = await loadCachedProgram();
  if (cached) return cached;

  // Tier 3: Fall back to bundled default
  return {
    LEVELS: defaultProgram.LEVELS,
    LEVEL_ORDER: defaultProgram.LEVEL_ORDER,
    CIRCUIT: defaultProgram.CIRCUIT,
    SCHEDULE: defaultProgram.SCHEDULE,
    DAY_KEYS: defaultProgram.DAY_KEYS,
    FLOW_MILESTONES_MIN: defaultProgram.FLOW_MILESTONES_MIN,
  };
}
