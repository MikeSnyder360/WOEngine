/** mm:ss — the default for anything the user reads mid-workout. */
export function clock(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Ceiling seconds — a countdown should show "1" for the whole final second. */
export function countdown(ms) {
  return String(Math.max(0, Math.ceil(ms / 1000)));
}

/** Split times get a decimal; rope pace differences live in the tenths. */
export function split(ms) {
  const total = Math.max(0, ms) / 1000;
  if (total < 60) return `${total.toFixed(1)}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
}

/** Signed delta against a previous session, e.g. "−4.2s" / "+1.1s". */
export function delta(ms) {
  const sign = ms < 0 ? '−' : '+';
  return `${sign}${(Math.abs(ms) / 1000).toFixed(1)}s`;
}

export function shortDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function weekdayName(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long' });
}
