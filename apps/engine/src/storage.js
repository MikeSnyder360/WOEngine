import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'hiit.history.v1';
const SETTINGS_KEY = 'hiit.settings.v1';

export const DEFAULT_SETTINGS = {
  level: 'reduced',
  soundEnabled: true,
};

/**
 * A saved session looks like:
 *   {
 *     id, startedAt (ISO), dayKey, type: 'circuit' | 'flow',
 *     level, rating (1–10),
 *     totalMs, activeMs, restMs,
 *     rounds: [ [ { order, name, target, unit, activeMs } ] ]   // circuit only
 *   }
 * Only completed sessions are written — bailing out discards.
 */

export async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[storage] could not read history', err);
    return [];
  }
}

export async function saveSession(session) {
  const history = await loadHistory();
  const next = [session, ...history];
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[storage] could not save session', err);
  }
  return next;
}

export async function deleteSession(id) {
  const history = await loadHistory();
  const next = history.filter((s) => s.id !== id);
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[storage] could not delete session', err);
  }
  return next;
}

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('[storage] could not read settings', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('[storage] could not save settings', err);
  }
  return settings;
}

/** Most recent completed circuit session at the same level, for the summary delta. */
export function findPrevious(history, { type, level, excludeId }) {
  return (
    history.find((s) => s.id !== excludeId && s.type === type && s.level === level) ?? null
  );
}
