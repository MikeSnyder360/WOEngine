import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Three cues, generated as local assets so there's nothing to license or fetch:
//   tick — the 3/2/1 countdown before rest ends
//   go   — a station is starting
//   done — round finished / workout finished
const SOURCES = {
  tick: require('../assets/tick.wav'),
  go: require('../assets/go.wav'),
  done: require('../assets/done.wav'),
};

let players = null;

export async function initAudio() {
  if (players) return;
  try {
    await setAudioModeAsync({
      // Cues still fire with the ringer off — you're working out, not in a meeting.
      playsInSilentMode: true,
      // Duck whatever you're listening to rather than stopping it.
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: false,
    });
  } catch (err) {
    // Audio mode is a nicety; never let it block the workout starting.
    console.warn('[sound] could not set audio mode', err);
  }

  try {
    players = Object.fromEntries(
      Object.entries(SOURCES).map(([name, src]) => [name, createAudioPlayer(src)])
    );
  } catch (err) {
    console.warn('[sound] could not create players', err);
    players = null;
  }
}

export function play(name) {
  const player = players?.[name];
  if (!player) return;
  // seekTo resolves async; firing play() straight after is what makes
  // rapid re-triggers (tick, tick, tick) restart rather than no-op.
  player.seekTo(0).then(
    () => player.play(),
    () => {}
  );
}

export function releaseAudio() {
  if (!players) return;
  for (const player of Object.values(players)) {
    try {
      player.remove();
    } catch {
      // already gone
    }
  }
  players = null;
}
